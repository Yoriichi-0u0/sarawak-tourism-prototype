import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Bus,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  Download,
  ExternalLink,
  Heart,
  Info,
  Leaf,
  Map,
  MapPin,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import {
  categories,
  pageCopy,
  regions,
  seedListings,
  type Kind,
  type Listing,
} from "./data";
import {
  dateForDay,
  dayNeighbor,
  decodeTrip,
  emptyTrip,
  encodeTrip,
  filterListings,
  normalizeTrip,
  safeProvider,
  type Trip,
} from "./domain";
import Modal from "./components/Modal";

type Page = Kind | "transport" | "saved" | "trip" | "manage";
type Activity = {
  searches: number;
  views: Record<string, number>;
  providerClicks: number;
  saves: number;
};
const initialActivity: Activity = {
  searches: 0,
  views: {},
  providerClicks: 0,
  saves: 0,
};
const pages: Page[] = [
  "discover",
  "stays",
  "transport",
  "food",
  "saved",
  "trip",
  "manage",
];
const labels: Record<Page, string> = {
  discover: "Discover",
  stays: "Stays",
  transport: "Getting around",
  food: "Food & drink",
  saved: "Saved",
  trip: "My trip",
  manage: "Management demo",
};
function readStored<T>(
  key: string,
  fallback: T,
  validate: (v: unknown) => boolean,
): T {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return validate(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}
function validListings(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.length < 300 &&
    v.every(
      (l) =>
        l &&
        [
          "id",
          "name",
          "region",
          "category",
          "image",
          "description",
          "duration",
          "note",
          "url",
        ].every((k) => typeof l[k] === "string") &&
        ["discover", "stays", "food"].includes(l.kind) &&
        typeof l.published === "boolean" &&
        safeProvider(l.url) &&
        [
          "hero",
          "bako",
          "culture",
          "wildlife",
          "food",
          "stay",
          "cave",
          "museum",
          "waterfront",
          "kolo",
          "cafe",
        ].includes(l.image),
    )
  );
}
function initialPage(): Page {
  const p = location.hash.slice(1);
  return pages.includes(p as Page) ? (p as Page) : "discover";
}
function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M16 1v30M1 16h30M10 22l4-8 8-4-4 8z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M16 3l-2 5h4zM29 16l-5-2v4zM16 29l2-5h-4zM3 16l5 2v-4z"
        fill="currentColor"
      />
    </svg>
  );
}
function photo(image: string) {
  return `/images/${image}.webp`;
}
function csvCell(value: string | number) {
  return `"${String(value)
    .replace(/^[=+@-]/, "'")
    .replaceAll('"', '""')}"`;
}
function saveText(text: string, name: string, type: string) {
  const u = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

export default function App() {
  const [page, setPage] = useState<Page>(initialPage);
  const [listings, setListings] = useState<Listing[]>(() =>
    readStored("sarawak:listings:v1", seedListings, validListings),
  );
  const validIds = useMemo(
    () => new Set(listings.map((l) => l.id)),
    [listings],
  );
  const [saved, setSaved] = useState<string[]>(() =>
    readStored(
      "sarawak:saved:v1",
      [],
      (v) => Array.isArray(v) && v.every((id) => typeof id === "string"),
    ),
  );
  const [trip, setTrip] = useState<Trip>(() => {
    try {
      return (
        normalizeTrip(
          JSON.parse(localStorage.getItem("sarawak:trip:v1") || "null"),
          validIds,
        ) || emptyTrip
      );
    } catch {
      return emptyTrip;
    }
  });
  const [activity, setActivity] = useState<Activity>(() =>
    readStored(
      "sarawak:activity:v1",
      initialActivity,
      (v) =>
        !!v &&
        typeof v === "object" &&
        ["searches", "providerClicks", "saves"].every((k) =>
          Number.isFinite((v as Record<string, number>)[k]),
        ) &&
        !!(v as Activity).views &&
        typeof (v as Activity).views === "object" &&
        Object.values((v as Activity).views).every(
          (n) => typeof n === "number" && Number.isFinite(n) && n >= 0,
        ),
    ),
  );
  const [storageFailed, setStorageFailed] = useState(false);
  const [query, setQuery] = useState(""),
    [region, setRegion] = useState("All regions"),
    [category, setCategory] = useState(""),
    [sort, setSort] = useState("Recommended");
  const [detail, setDetail] = useState<Listing | null>(null),
    [toast, setToast] = useState(""),
    [menu, setMenu] = useState(false);
  const [compared, setCompared] = useState<string[]>([]),
    [compareOpen, setCompareOpen] = useState(false);
  const [share, setShare] = useState(""),
    [shared, setShared] = useState<Trip | null>(null),
    [shareError, setShareError] = useState("");
  const [manager, setManager] = useState(false),
    [managerTab, setManagerTab] = useState("listings"),
    [editing, setEditing] = useState<Listing | "new" | null>(null);
  const [managerQuery, setManagerQuery] = useState(""),
    [origin, setOrigin] = useState("Kuching city"),
    [destination, setDestination] = useState("Bako National Park"),
    [journey, setJourney] = useState<{
      origin: string;
      destination: string;
    } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const closeDetail = useCallback(() => setDetail(null), []),
    closeCompare = useCallback(() => setCompareOpen(false), []),
    closeEdit = useCallback(() => setEditing(null), []),
    closeShare = useCallback(() => setShare(""), []);
  const notify = (message: string) => setToast(message);
  const navigate = (p: Page) => {
    if (p === page) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setMenu(false);
      return;
    }
    location.hash = p;
    setMenu(false);
  };
  useEffect(() => {
    const change = () => {
      setPage(initialPage());
      setQuery("");
      setRegion("All regions");
      setCategory("");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    for (const [key, value] of Object.entries({
      listings: listings,
      saved: saved,
      trip: trip,
      activity: activity,
    })) {
      try {
        localStorage.setItem(`sarawak:${key}:v1`, JSON.stringify(value));
      } catch {
        setStorageFailed(true);
      }
    }
  }, [listings, saved, trip, activity]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const code = new URLSearchParams(location.search).get("itinerary");
    if (code) {
      const incoming = decodeTrip(code, new Set(seedListings.map((l) => l.id)));
      if (incoming) setShared(incoming);
      else
        setShareError(
          "This trip link could not be read. You can still start a new trip.",
        );
    }
  }, []);
  useEffect(() => {
    if (!manager) return;
    let last = Date.now();
    const active = () => {
      last = Date.now();
    };
    ["pointerdown", "keydown", "scroll"].forEach((e) =>
      window.addEventListener(e, active),
    );
    const timer = setInterval(() => {
      if (Date.now() - last > 15 * 60 * 1000) {
        setManager(false);
        setEditing(null);
        setToast(
          "Management demo session ended after 15 minutes of inactivity.",
        );
      }
    }, 10000);
    return () => {
      clearInterval(timer);
      ["pointerdown", "keydown", "scroll"].forEach((e) =>
        window.removeEventListener(e, active),
      );
    };
  }, [manager]);
  const toggleSaved = (id: string) => {
    const exists = saved.includes(id);
    setSaved((s) => (exists ? s.filter((i) => i !== id) : [...s, id]));
    if (!exists) setActivity((a) => ({ ...a, saves: a.saves + 1 }));
    notify(exists ? "Removed from saved places." : "Saved for a little later.");
  };
  const addTrip = (id: string, day = 1) => {
    if (trip.items.some((i) => i.id === id)) {
      notify("This place is already in your trip.");
      return;
    }
    setTrip((t) => ({ ...t, items: [...t.items, { id, day, note: "" }] }));
    notify(`Added to day ${day}. Your adventure is taking shape.`);
  };
  const openDetail = (listing: Listing) => {
    setDetail(listing);
    setActivity((a) => ({
      ...a,
      views: { ...a.views, [listing.id]: (a.views[listing.id] || 0) + 1 },
    }));
  };
  const provider = () =>
    setActivity((a) => ({ ...a, providerClicks: a.providerClicks + 1 }));
  const compare = (id: string) => {
    if (compared.includes(id)) setCompared((c) => c.filter((i) => i !== id));
    else if (compared.length < 3) setCompared((c) => [...c, id]);
    else notify("Compare up to three places at a time.");
  };
  const isKind = (p: Page): p is Kind =>
    ["discover", "stays", "food"].includes(p);
  const currentCategory =
    category || (isKind(page) ? categories[page][0] : "All experiences");
  const filtered = isKind(page)
    ? filterListings(listings, page, query, region, currentCategory, sort)
    : listings.filter((l) => l.published && saved.includes(l.id));
  const shareTrip = () => {
    const shareable = {
      ...trip,
      items: trip.items.filter((i) => seedListings.some((l) => l.id === i.id)),
    };
    const url = new URL(location.href);
    url.search = "";
    url.searchParams.set("itinerary", encodeTrip(shareable));
    url.hash = "trip";
    setShare(url.toString());
  };
  const reorder = (index: number, direction: number) =>
    setTrip((t) => {
      const items = [...t.items];
      const other = dayNeighbor(items, index, direction);
      if (other < 0) return t;
      [items[index], items[other]] = [items[other], items[index]];
      return { ...t, items };
    });
  const tripText = () =>
    `${trip.name}\n${trip.start ? `Starting ${trip.start}\n` : ""}\n${Array.from(
      { length: trip.days },
      (_, i) =>
        `Day ${i + 1}\n${
          trip.items
            .filter((x) => x.day === i + 1)
            .map(
              (x) =>
                `${listings.find((l) => l.id === x.id)?.name || "Place no longer available"}${x.note ? ` — ${x.note}` : ""}`,
            )
            .join("\n") || "A little room for spontaneity."
        }`,
    ).join(
      "\n\n",
    )}\n\nCreated with sarawak. Tourism prototype. Confirm arrangements directly with providers.`;
  const card = (l: Listing) => (
    <article className="place-card" key={l.id}>
      <div className="card-photo">
        <button
          className="photo-link"
          onClick={() => openDetail(l)}
          aria-label={`Explore ${l.name}`}
        >
          <img
            src={photo(l.image)}
            alt={
              l.name === "Bako National Park"
                ? "Illustrative sandstone coastline with a lush green forest"
                : `Illustrative travel image for ${l.name}`
            }
            loading="lazy"
          />
        </button>
        <button
          className={`save-button ${saved.includes(l.id) ? "is-saved" : ""}`}
          onClick={() => toggleSaved(l.id)}
          aria-label={`${saved.includes(l.id) ? "Unsave" : "Save"} ${l.name}`}
          aria-pressed={saved.includes(l.id)}
        >
          <Heart fill={saved.includes(l.id) ? "currentColor" : "none"} />
        </button>
      </div>
      <button className="card-title" onClick={() => openDetail(l)}>
        {l.name}
      </button>
      <p className="card-meta">
        {l.region}
        <span>·</span>
        {l.category}
      </p>
      <div className="card-actions">
        <button
          className="button button-small button-outline"
          onClick={() => addTrip(l.id)}
        >
          {trip.items.some((i) => i.id === l.id) ? (
            <Check size={16} />
          ) : (
            <Plus size={16} />
          )}{" "}
          {trip.items.some((i) => i.id === l.id)
            ? "In your trip"
            : "Add to trip"}
        </button>
        <button
          className={`compare-button ${compared.includes(l.id) ? "selected" : ""}`}
          onClick={() => compare(l.id)}
          aria-pressed={compared.includes(l.id)}
          aria-label={`Compare ${l.name}`}
        >
          <SlidersHorizontal size={16} />
          <span>Compare</span>
        </button>
      </div>
    </article>
  );
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={() => navigate("discover")}
            aria-label="Sarawak home"
          >
            <BrandMark />
            <span>sarawak.</span>
          </button>
          <nav className="desktop-nav" aria-label="Main navigation">
            {(["discover", "stays", "transport", "food"] as Page[]).map((p) => (
              <button
                key={p}
                className={page === p ? "active" : ""}
                onClick={() => navigate(p)}
                aria-current={page === p ? "page" : undefined}
              >
                {labels[p]}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className={`button button-outline ${page === "saved" ? "active" : ""}`}
              onClick={() => navigate("saved")}
            >
              <Heart size={18} />
              Saved
              {saved.length > 0 && (
                <span className="count">{saved.length}</span>
              )}
            </button>
            <button
              className="button button-primary"
              onClick={() => navigate("trip")}
            >
              <Map size={18} />
              My trip
              {trip.items.length > 0 && (
                <span className="count">{trip.items.length}</span>
              )}
            </button>
          </div>
          <button
            className="mobile-menu icon-button"
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {menu && (
        <nav className="menu-panel" aria-label="More navigation">
          {pages.map((p) => (
            <button key={p} onClick={() => navigate(p)}>
              <span>{labels[p]}</span>
              <ChevronRight size={18} />
            </button>
          ))}
        </nav>
      )}
      <main
        id="main-content"
        tabIndex={-1}
        className={`main-container ${page === "manage" ? "management-container" : ""}`}
      >
        {storageFailed && (
          <div className="notice">
            <Info size={18} />
            Your browser could not save changes. You can keep exploring, or
            export your trip before leaving.
          </div>
        )}
        {shared && (
          <div className="shared-banner">
            <div>
              <strong>A Sarawak adventure, shared with you.</strong>
              <p>
                “{shared.name}” · {shared.days} days · {shared.items.length}{" "}
                {shared.items.length === 1 ? "place" : "places"}. Importing
                replaces your current itinerary.
              </p>
            </div>
            <button
              className="button button-primary"
              onClick={() => {
                setTrip(shared);
                setShared(null);
                notify("Shared trip imported. Make it your own.");
                navigate("trip");
              }}
            >
              Import trip
              <ArrowRight size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Dismiss shared trip"
              onClick={() => setShared(null)}
            >
              <X />
            </button>
          </div>
        )}
        {shareError && (
          <div className="notice">
            <Info size={18} />
            {shareError}
            <button
              className="icon-button"
              aria-label="Dismiss message"
              onClick={() => setShareError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="breadcrumb">
          <button onClick={() => navigate("discover")}>Home</button>
          <span>/</span>
          <span>{labels[page]}</span>
        </div>
        {isKind(page) && (
          <>
            <section className="page-intro">
              <div>
                <h1>
                  {page === "discover" ? (
                    <>
                      <span>
                        A little <em>wild.</em>
                      </span>
                      <span className="heading-continuation">
                        {" "}
                        A lot to discover.
                      </span>
                    </>
                  ) : (
                    pageCopy[page].title
                  )}
                </h1>
                <p>{pageCopy[page].subtitle}</p>
              </div>
              <button
                className="button button-outline rounded"
                onClick={() => navigate("trip")}
              >
                Plan your trip
                <ArrowRight size={17} />
              </button>
            </section>
            <section
              className={`hero hero-${page}`}
              aria-label={
                page === "discover" ? "Discover Sarawak" : pageCopy[page].title
              }
            >
              <img
                src={photo(
                  page === "discover"
                    ? "hero"
                    : page === "stays"
                      ? "stay"
                      : "food",
                )}
                alt={
                  page === "discover"
                    ? "Illustrative Borneo rainforest and emerald river"
                    : page === "stays"
                      ? "Illustrative tropical boutique room"
                      : "Illustrative bowl of Sarawak laksa"
                }
                fetchPriority="high"
              />
              <div className="hero-content">
                <h2>
                  {page === "discover"
                    ? "Take the scenic route."
                    : page === "stays"
                      ? "Stay a little longer."
                      : "Good mornings start here."}
                </h2>
                <p>
                  {page === "discover"
                    ? "Let Sarawak surprise you."
                    : page === "stays"
                      ? "Leave a little room to unwind."
                      : "A taste of Sarawak, one bowl at a time."}
                </p>
              </div>
              <span className="hero-location">
                <MapPin size={16} />
                Borneo, Malaysia
              </span>
            </section>
            <form
              className="search-bar"
              onSubmit={(e) => {
                e.preventDefault();
                setActivity((a) => ({ ...a, searches: a.searches + 1 }));
                document
                  .getElementById("results")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <label className="search-input">
                <Search size={21} />
                <span className="sr-only">
                  Search {labels[page].toLowerCase()}
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    page === "discover"
                      ? "Search places, experiences, and more"
                      : page === "stays"
                        ? "Search stays, locations, and more"
                        : "Search flavours, cafés, and more"
                  }
                />
                {query && (
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </label>
              <label className="region-select">
                <MapPin size={20} />
                <span className="sr-only">Region</span>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  {regions.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <button className="button button-primary search-submit">
                Explore
              </button>
            </form>
            <div
              className="category-tabs"
              role="group"
              aria-label={`Filter ${labels[page]}`}
            >
              {categories[page].map((c) => (
                <button
                  key={c}
                  className={c === currentCategory ? "selected" : ""}
                  aria-pressed={c === currentCategory}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <section id="results" className="results-section">
              <div className="section-heading">
                <div>
                  <h2>{pageCopy[page].section}</h2>
                  <span aria-live="polite">
                    {filtered.length}{" "}
                    {page === "discover"
                      ? "experiences"
                      : page === "stays"
                        ? "stays"
                        : "flavours"}
                  </span>
                </div>
                <label className="sort-select">
                  <span className="sr-only">Sort results</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option>Recommended</option>
                    <option>Name A–Z</option>
                  </select>
                </label>
              </div>
              {filtered.length ? (
                <div className="places-grid">{filtered.map(card)}</div>
              ) : (
                <div className="empty-state">
                  <Search />
                  <h2>A different path awaits.</h2>
                  <p>
                    No places match these filters. Try another name or explore
                    all regions.
                  </p>
                  <button
                    className="button button-primary"
                    onClick={() => {
                      setQuery("");
                      setRegion("All regions");
                      setCategory(categories[page][0]);
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </section>
            <section className="planning-band">
              <div>
                <span className="band-icon">
                  <Map size={30} />
                </span>
                <h2>
                  Your kind of Sarawak.
                  <br />
                  Your own little adventure.
                </h2>
                <p>
                  Keep the places you love. Bring them together in a trip that
                  feels like you.
                </p>
              </div>
              <button
                className="button button-primary"
                onClick={() => navigate("trip")}
              >
                Start planning
                <ArrowRight size={17} />
              </button>
            </section>
          </>
        )}
        {page === "saved" && (
          <>
            <section className="page-intro">
              <div>
                <h1>Keep a little inspiration.</h1>
                <p>The places that caught your eye, ready when you are.</p>
              </div>
              <button
                className="button button-outline"
                onClick={() => navigate("discover")}
              >
                Keep exploring
                <ArrowRight size={16} />
              </button>
            </section>
            {filtered.length ? (
              <div className="places-grid">{filtered.map(card)}</div>
            ) : (
              <div className="empty-state">
                <Heart />
                <h2>Something will catch your eye.</h2>
                <p>Tap the heart on a place to keep it here for later.</p>
                <button
                  className="button button-primary"
                  onClick={() => navigate("discover")}
                >
                  Discover Sarawak
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
        {page === "transport" && (
          <>
            <section className="page-intro">
              <div>
                <h1>The journey is part of it.</h1>
                <p>
                  Find your way between city streets, forest trails, and the
                  next adventure.
                </p>
              </div>
            </section>
            <div className="transport-layout">
              <div>
                <form
                  className="journey-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (origin === destination) {
                      notify(
                        "Choose a destination different from your starting point.",
                      );
                      return;
                    }
                    setJourney({ origin, destination });
                    setActivity((a) => ({ ...a, searches: a.searches + 1 }));
                  }}
                >
                  <h2>Where are you heading?</h2>
                  <label>
                    <span>From</span>
                    <select
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                    >
                      {["Kuching city", "Kuching Airport", "Miri city"].map(
                        (x) => (
                          <option key={x}>{x}</option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    <span>To</span>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    >
                      {[
                        "Bako National Park",
                        "Sarawak Cultural Village",
                        "Semenggoh Wildlife Centre",
                        "Kuching city",
                        "Gunung Mulu National Park",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <button className="button button-primary">
                    Find my way
                    <ArrowRight size={17} />
                  </button>
                  <p className="small-note">
                    Journey suggestions are illustrative. Confirm routes, fares,
                    and schedules with the operator.
                  </p>
                </form>
              </div>
              <div className="transport-content">
                {journey ? (
                  <>
                    <h2>
                      {journey.origin}
                      <ArrowRight size={20} />
                      {journey.destination}
                    </h2>
                    {journey.origin === "Miri city" ||
                    journey.destination === "Gunung Mulu National Park" ? (
                      <div className="route-option">
                        <Compass />
                        <div>
                          <h3>Plan with a local operator</h3>
                          <p>
                            This journey may require intercity or air travel.
                            There is no verified direct route in this prototype.
                          </p>
                          <a
                            className="text-link"
                            href="https://www.sarawaktourism.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={provider}
                          >
                            Tourism information
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="route-option">
                          <Bus />
                          <div>
                            <h3>Public transport</h3>
                            <p>
                              Check current Kuching routes with BAS.MY. This
                              prototype does not verify a direct service to your
                              chosen destination.
                            </p>
                            <a
                              className="text-link"
                              href="https://bas.my/"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={provider}
                            >
                              Check operator routes
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                        <div className="route-option">
                          <MapPin />
                          <div>
                            <h3>Taxi or ride-hailing</h3>
                            <p>
                              Ask a licensed taxi operator or check a
                              ride-hailing app for a current quote and service
                              coverage. Arrange your return journey too.
                            </p>
                            <a
                              className="text-link"
                              href="https://www.grab.com/my/transport/"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={provider}
                            >
                              View Grab transport
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                        {journey.destination === "Bako National Park" && (
                          <div className="route-option">
                            <Map />
                            <div>
                              <h3>The final stretch: a boat journey</h3>
                              <p>
                                Bako park access involves a boat transfer. Check
                                weather, departure arrangements, and return
                                availability directly with the park.
                              </p>
                              <a
                                className="text-link"
                                href="https://sarawakforestry.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={provider}
                              >
                                Park visitor information
                                <ExternalLink size={14} />
                              </a>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="transport-placeholder">
                    <img
                      src={photo("bako")}
                      alt="Illustrative sandstone coast"
                    />
                    <h2>A little planning goes a long way.</h2>
                    <p>
                      Choose your starting point and destination to explore ways
                      to get there.
                    </p>
                  </div>
                )}
                <div className="notice">
                  <Info size={18} />
                  Allow extra time for rural travel and confirm your return
                  arrangements before setting off.
                </div>
              </div>
            </div>
          </>
        )}
        {page === "trip" && (
          <>
            <section className="page-intro">
              <div>
                <h1>A little plan. A big adventure.</h1>
                <p>Bring your favourites together, one day at a time.</p>
              </div>
              <div className="intro-actions">
                <button
                  className="button button-outline"
                  onClick={() =>
                    saveText(tripText(), "sarawak-itinerary.txt", "text/plain")
                  }
                >
                  <Download size={17} />
                  Export
                </button>
                <button className="button button-primary" onClick={shareTrip}>
                  <Map size={17} />
                  Share trip
                </button>
              </div>
            </section>
            <div className="trip-layout">
              <aside className="trip-settings">
                <div className="trip-cover">
                  <img
                    src={photo("hero")}
                    alt="Illustrative Borneo landscape"
                  />
                  <span>
                    <Compass />
                    Your Sarawak story
                  </span>
                </div>
                <div className="trip-fields">
                  <label>
                    Trip name
                    <input
                      maxLength={80}
                      value={trip.name}
                      onChange={(e) =>
                        setTrip((t) => ({ ...t, name: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Start date <span className="optional">optional</span>
                    <input
                      type="date"
                      value={trip.start}
                      onChange={(e) =>
                        setTrip((t) => ({ ...t, start: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    How many days?
                    <select
                      value={trip.days}
                      onChange={(e) => {
                        const days = Number(e.target.value);
                        setTrip((t) => ({
                          ...t,
                          days,
                          items: t.items.map((i) => ({
                            ...i,
                            day: Math.min(i.day, days),
                          })),
                        }));
                      }}
                    >
                      {Array.from({ length: 14 }, (_, i) => (
                        <option value={i + 1} key={i}>
                          {i + 1} {i ? "days" : "day"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="small-note">
                    <Check size={14} />{" "}
                    {storageFailed
                      ? "Changes are not being saved"
                      : "Saved on this device"}{" "}
                    · {trip.items.length}{" "}
                    {trip.items.length === 1 ? "place" : "places"}
                  </p>
                  <button
                    className="button button-outline"
                    onClick={() => navigate("discover")}
                  >
                    Find more places
                    <Plus size={16} />
                  </button>
                </div>
              </aside>
              <div className="trip-days">
                {Array.from({ length: trip.days }, (_, d) => (
                  <section className="trip-day" key={d}>
                    <div className="day-heading">
                      <span>{String(d + 1).padStart(2, "0")}</span>
                      <div>
                        <h2>Day {d + 1}</h2>
                        <p>
                          {trip.start
                            ? dateForDay(trip.start, d)
                            : [
                                "A fresh start",
                                "Follow your curiosity",
                                "Make a little memory",
                              ][d % 3]}
                        </p>
                      </div>
                      <span className="day-count">
                        {trip.items.filter((i) => i.day === d + 1).length}{" "}
                        {trip.items.filter((i) => i.day === d + 1).length === 1
                          ? "place"
                          : "places"}
                      </span>
                    </div>
                    {trip.items
                      .filter((i) => i.day === d + 1)
                      .map((item) => {
                        const l = listings.find((x) => x.id === item.id);
                        if (!l) return null;
                        const index = trip.items.indexOf(item);
                        return (
                          <div className="trip-item" key={item.id}>
                            <button
                              className="trip-item-image"
                              onClick={() => openDetail(l)}
                              aria-label={`View ${l.name}`}
                            >
                              <img src={photo(l.image)} alt="" />
                            </button>
                            <div className="trip-item-info">
                              <button
                                className="card-title"
                                onClick={() => openDetail(l)}
                              >
                                {l.name}
                              </button>
                              <p>
                                {l.region} · {l.duration}
                              </p>
                              <input
                                aria-label={`Note for ${l.name}`}
                                placeholder="Add a little note…"
                                maxLength={500}
                                value={item.note}
                                onChange={(e) =>
                                  setTrip((t) => ({
                                    ...t,
                                    items: t.items.map((x) =>
                                      x.id === item.id
                                        ? { ...x, note: e.target.value }
                                        : x,
                                    ),
                                  }))
                                }
                              />
                              <div className="item-tools">
                                <label>
                                  <span className="sr-only">
                                    Move {l.name} to day
                                  </span>
                                  <select
                                    value={item.day}
                                    onChange={(e) =>
                                      setTrip((t) => ({
                                        ...t,
                                        items: t.items.map((x) =>
                                          x.id === item.id
                                            ? {
                                                ...x,
                                                day: Number(e.target.value),
                                              }
                                            : x,
                                        ),
                                      }))
                                    }
                                  >
                                    {Array.from(
                                      { length: trip.days },
                                      (_, i) => (
                                        <option key={i} value={i + 1}>
                                          Day {i + 1}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </label>
                                <button
                                  className="icon-button"
                                  disabled={
                                    dayNeighbor(trip.items, index, -1) < 0
                                  }
                                  onClick={() => reorder(index, -1)}
                                  aria-label={`Move ${l.name} earlier`}
                                >
                                  <ArrowUp size={15} />
                                </button>
                                <button
                                  className="icon-button"
                                  disabled={
                                    dayNeighbor(trip.items, index, 1) < 0
                                  }
                                  onClick={() => reorder(index, 1)}
                                  aria-label={`Move ${l.name} later`}
                                >
                                  <ArrowDown size={15} />
                                </button>
                                <button
                                  className="icon-button"
                                  onClick={() =>
                                    setTrip((t) => ({
                                      ...t,
                                      items: t.items.filter(
                                        (x) => x.id !== item.id,
                                      ),
                                    }))
                                  }
                                  aria-label={`Remove ${l.name} from trip`}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {!trip.items.some((i) => i.day === d + 1) && (
                      <button
                        className="empty-day"
                        onClick={() => navigate("discover")}
                      >
                        <Plus size={23} />
                        <span>A little room for discovery.</span>
                        <small>Explore places to add to your trip</small>
                      </button>
                    )}
                  </section>
                ))}
              </div>
            </div>
          </>
        )}
        {page === "manage" && (
          <>
            <section className="page-intro">
              <div>
                <h1>Keep Sarawak up to date.</h1>
                <p>A workspace for the people behind the places.</p>
              </div>
              {manager && (
                <button
                  className="button button-outline"
                  onClick={() => {
                    setManager(false);
                    setEditing(null);
                  }}
                >
                  End demo session
                </button>
              )}
            </section>
            <div className="notice management-notice">
              <ShieldCheck size={21} />
              <span>
                <strong>Management demo</strong> — edits and reports apply only
                to this browser. This is not a secure staff portal or a shared
                live database.
              </span>
            </div>
            {!manager ? (
              <div className="management-entry">
                <div className="entry-icon">
                  <Settings2 size={35} />
                </div>
                <h2>A look behind the guide.</h2>
                <p>
                  Try creating, editing, publishing, and archiving tourism
                  listings. Explore an activity report based on your own
                  interactions.
                </p>
                <p className="small-note">
                  The demo ends after 15 minutes of inactivity. Production staff
                  access would require server-side authentication and
                  authorization.
                </p>
                <button
                  className="button button-primary"
                  onClick={() => setManager(true)}
                >
                  Enter management demo
                  <ArrowRight size={17} />
                </button>
              </div>
            ) : (
              <div className="manager-layout">
                <aside className="manager-sidebar">
                  <button
                    className={managerTab === "listings" ? "selected" : ""}
                    onClick={() => setManagerTab("listings")}
                  >
                    <MapPin size={18} />
                    Tourism listings
                  </button>
                  <button
                    className={managerTab === "reports" ? "selected" : ""}
                    onClick={() => setManagerTab("reports")}
                  >
                    <BarChart3 size={18} />
                    Activity report
                  </button>
                  <div className="sidebar-note">
                    <Leaf />
                    <p>Good information makes better journeys.</p>
                  </div>
                </aside>
                <div className="manager-body">
                  {managerTab === "listings" ? (
                    <>
                      <div className="section-heading">
                        <div>
                          <h2>Tourism listings</h2>
                          <span>{listings.length} listings</span>
                        </div>
                        <button
                          className="button button-primary"
                          onClick={() => setEditing("new")}
                        >
                          <Plus size={17} />
                          New listing
                        </button>
                      </div>
                      <label className="management-search">
                        <Search size={18} />
                        <span className="sr-only">
                          Search management listings
                        </span>
                        <input
                          value={managerQuery}
                          onChange={(e) => setManagerQuery(e.target.value)}
                          placeholder="Find a listing…"
                        />
                      </label>
                      <div className="listing-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Listing</th>
                              <th>Category</th>
                              <th>Status</th>
                              <th>
                                <span className="sr-only">Actions</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {listings
                              .filter((l) =>
                                `${l.name} ${l.region}`
                                  .toLowerCase()
                                  .includes(managerQuery.toLowerCase()),
                              )
                              .map((l) => (
                                <tr key={l.id}>
                                  <td>
                                    <div className="table-name">
                                      <img src={photo(l.image)} alt="" />
                                      <div>
                                        <strong>{l.name}</strong>
                                        <span>{l.region}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td>{l.category}</td>
                                  <td>
                                    <span
                                      className={`status ${l.published ? "published" : ""}`}
                                    >
                                      {l.published ? "Published" : "Archived"}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="table-actions">
                                      <button onClick={() => setEditing(l)}>
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => {
                                          setListings((ls) =>
                                            ls.map((x) =>
                                              x.id === l.id
                                                ? {
                                                    ...x,
                                                    published: !x.published,
                                                  }
                                                : x,
                                            ),
                                          );
                                          notify(
                                            l.published
                                              ? "Listing archived in this browser."
                                              : "Listing published in this browser.",
                                          );
                                        }}
                                      >
                                        {l.published ? "Archive" : "Publish"}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {!listings.some((l) =>
                          `${l.name} ${l.region}`
                            .toLowerCase()
                            .includes(managerQuery.toLowerCase()),
                        ) && (
                          <p className="table-empty">
                            No listings match your search.
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="section-heading">
                        <div>
                          <h2>A little insight</h2>
                          <span>This browser’s activity</span>
                        </div>
                        <button
                          className="button button-outline"
                          onClick={() =>
                            saveText(
                              [
                                ["Metric", "Count"],
                                ["Searches", activity.searches],
                                [
                                  "Listing views",
                                  Object.values(activity.views).reduce(
                                    (a, b) => a + b,
                                    0,
                                  ),
                                ],
                                ["Save actions", activity.saves],
                                [
                                  "Provider link clicks",
                                  activity.providerClicks,
                                ],
                                ...listings.map((l) => [
                                  `Views: ${l.name}`,
                                  activity.views[l.id] || 0,
                                ]),
                              ]
                                .map((row) => row.map(csvCell).join(","))
                                .join("\r\n"),
                              "sarawak-local-activity.csv",
                              "text/csv",
                            )
                          }
                        >
                          <Download size={17} />
                          Export CSV
                        </button>
                      </div>
                      <p className="report-caption">
                        Counts reflect actions taken here, on this device.
                        Reservations happen externally and are not tracked.
                      </p>
                      <div className="report-metrics">
                        {[
                          ["Searches", activity.searches],
                          [
                            "Listing views",
                            Object.values(activity.views).reduce(
                              (a, b) => a + b,
                              0,
                            ),
                          ],
                          ["Save actions", activity.saves],
                          ["Provider visits", activity.providerClicks],
                        ].map(([label, count]) => (
                          <div key={label}>
                            <span>{label}</span>
                            <strong>{count}</strong>
                          </div>
                        ))}
                      </div>
                      <h3 className="report-title">
                        Places explored on this device
                      </h3>
                      {Object.keys(activity.views).length ? (
                        <div className="activity-bars">
                          {listings
                            .filter((l) => activity.views[l.id])
                            .sort(
                              (a, b) =>
                                activity.views[b.id] - activity.views[a.id],
                            )
                            .map((l) => (
                              <div className="activity-row" key={l.id}>
                                <span>{l.name}</span>
                                <div>
                                  <i
                                    style={{
                                      width: `${(activity.views[l.id] / Math.max(...Object.values(activity.views))) * 100}%`,
                                    }}
                                  />
                                </div>
                                <strong>{activity.views[l.id]}</strong>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="empty-report">
                          <BarChart3 size={30} />
                          <p>
                            Explore a listing to start seeing activity here.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  <button
                    className="reset-demo"
                    onClick={() => setResetOpen(true)}
                  >
                    Reset demo data on this device
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="site-footer">
        <div>
          <button className="brand" onClick={() => navigate("discover")}>
            <BrandMark />
            <span>sarawak.</span>
          </button>
          <p>A little wild. A lot to discover.</p>
        </div>
        <div className="footer-links">
          <a
            href="https://www.sarawaktourism.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Official tourism information
            <ExternalLink size={13} />
          </a>
          <button onClick={() => navigate("manage")}>
            Management demo
            <ArrowRight size={14} />
          </button>
          <span>
            Interactive prototype · Concept imagery & illustrative travel
            information
          </span>
        </div>
      </footer>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {(
          [
            { p: "discover", Icon: Compass },
            { p: "saved", Icon: Heart },
            { p: "trip", Icon: Map },
          ] as const
        ).map(({ p, Icon }) => (
          <button
            key={p}
            className={page === p ? "active" : ""}
            onClick={() => navigate(p)}
            aria-current={page === p ? "page" : undefined}
          >
            <Icon size={22} />
            <span>
              {labels[p]}
              {p === "trip" && trip.items.length > 0
                ? ` (${trip.items.length})`
                : ""}
            </span>
          </button>
        ))}
        <button
          className={menu ? "active" : ""}
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
        >
          <MoreHorizontal size={22} />
          <span>More</span>
        </button>
      </nav>
      {compared.length > 0 && !compareOpen && (
        <div className="compare-tray">
          <span>
            {compared.length} {compared.length === 1 ? "place" : "places"}{" "}
            selected
          </span>
          <button
            className="button button-primary button-small"
            disabled={compared.length < 2}
            onClick={() => setCompareOpen(true)}
          >
            Compare places
          </button>
          <button
            className="icon-button"
            aria-label="Clear comparison"
            onClick={() => setCompared([])}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          <span>{toast}</span>
          <button
            className="icon-button"
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {detail && (
        <Modal title={detail.name} onClose={closeDetail} wide>
          <div className="detail-layout">
            <img
              className="detail-photo"
              src={photo(detail.image)}
              alt={`Illustrative travel photograph for ${detail.name}`}
            />
            <div className="detail-body">
              <p className="detail-meta">
                <MapPin size={16} />
                {detail.region}
                <span>·</span>
                {detail.category}
              </p>
              <h3>A little closer</h3>
              <p>{detail.description}</p>
              <div className="detail-duration">
                <Clock3 size={18} />
                {detail.duration}
              </div>
              <div className="visit-note">
                <Info size={18} />
                <div>
                  <strong>Before you go</strong>
                  <p>{detail.note}</p>
                </div>
              </div>
              <p className="small-note">
                Concept image · Visit details and availability need confirmation
                with the provider.
              </p>
              <div className="detail-actions">
                <button
                  className="button button-primary"
                  onClick={() => addTrip(detail.id)}
                >
                  {trip.items.some((i) => i.id === detail.id) ? (
                    <Check size={17} />
                  ) : (
                    <Plus size={17} />
                  )}{" "}
                  {trip.items.some((i) => i.id === detail.id)
                    ? "In your trip"
                    : "Add to trip"}
                </button>
                <button
                  className="button button-outline"
                  onClick={() => toggleSaved(detail.id)}
                >
                  <Heart
                    size={17}
                    fill={saved.includes(detail.id) ? "currentColor" : "none"}
                  />
                  {saved.includes(detail.id) ? "Saved" : "Save place"}
                </button>
              </div>
              <a
                className="provider-link"
                href={safeProvider(detail.url) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                onClick={provider}
              >
                {detail.kind === "stays"
                  ? "Find real stays on Agoda"
                  : "Check official information"}
                <ExternalLink size={16} />
              </a>
              <button className="text-link" onClick={() => compare(detail.id)}>
                <SlidersHorizontal size={16} />
                {compared.includes(detail.id)
                  ? "Remove from comparison"
                  : "Add to comparison"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {compareOpen && (
        <Modal title="Find your kind of place." onClose={closeCompare} wide>
          <div
            className="comparison-grid"
            style={{
              gridTemplateColumns: `repeat(${compared.length},minmax(0,1fr))`,
            }}
          >
            {compared.map((id) => {
              const l = listings.find((x) => x.id === id);
              return l ? (
                <article key={id}>
                  <img src={photo(l.image)} alt="Illustrative travel image" />
                  <h3>{l.name}</h3>
                  <dl>
                    <dt>Region</dt>
                    <dd>{l.region}</dd>
                    <dt>Experience</dt>
                    <dd>{l.category}</dd>
                    <dt>Suggested time</dt>
                    <dd>{l.duration}</dd>
                    <dt>Visit information</dt>
                    <dd>{l.note}</dd>
                  </dl>
                  <button
                    className="button button-primary"
                    onClick={() => addTrip(id)}
                  >
                    <Plus size={16} />
                    Add to trip
                  </button>
                </article>
              ) : null;
            })}
          </div>
        </Modal>
      )}
      {share && (
        <Modal title="An adventure worth sharing." onClose={closeShare}>
          <p>
            Send this link to someone you’d love to explore with. They can
            import a copy of your trip.
          </p>
          <label className="share-label">
            Your trip link
            <input readOnly value={share} onFocus={(e) => e.target.select()} />
          </label>
          <button
            className="button button-primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(share);
                notify("Trip link copied.");
              } catch {
                notify("Select the trip link and copy it manually.");
              }
            }}
          >
            Copy link
            <ArrowRight size={16} />
          </button>
          <p className="small-note">
            The link includes your trip title, dates, and notes. Listings you
            create in the management demo are only available on your device and
            are excluded.
          </p>
        </Modal>
      )}
      {editing && manager && (
        <Modal
          title={
            editing === "new" ? "A new place to discover." : "A little update."
          }
          onClose={closeEdit}
        >
          <ListingForm
            listing={editing === "new" ? null : editing}
            onCancel={closeEdit}
            onSave={(l) => {
              setListings((ls) =>
                editing === "new"
                  ? [...ls, l]
                  : ls.map((x) => (x.id === l.id ? l : x)),
              );
              setEditing(null);
              notify("Listing saved in this browser.");
            }}
          />
        </Modal>
      )}
      {resetOpen && (
        <Modal
          title="Start fresh on this device?"
          onClose={() => setResetOpen(false)}
        >
          <p>
            This restores the original listings and clears your saved places,
            trip, and local activity. Other visitors’ data is unaffected.
          </p>
          <div className="detail-actions">
            <button
              className="button button-outline"
              onClick={() => setResetOpen(false)}
            >
              Keep my data
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                setListings(seedListings);
                setSaved([]);
                setTrip(emptyTrip);
                setActivity(initialActivity);
                setCompared([]);
                setResetOpen(false);
                notify("Demo restored to a fresh start.");
              }}
            >
              Reset local demo
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ListingForm({
  listing,
  onSave,
  onCancel,
}: {
  listing: Listing | null;
  onSave: (l: Listing) => void;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<Kind>(listing?.kind || "discover"),
    [error, setError] = useState("");
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name")).trim(),
      url = String(form.get("url")).trim(),
      description = String(form.get("description")).trim();
    if (!name || !description) {
      setError("Add a place name and description.");
      return;
    }
    if (!safeProvider(url)) {
      setError("Use a complete https:// provider address.");
      return;
    }
    onSave({
      id: listing?.id || `local-${crypto.randomUUID()}`,
      name,
      kind,
      region: String(form.get("region")),
      category: String(form.get("category")),
      description,
      url,
      image: String(form.get("image")),
      duration:
        String(form.get("duration")).trim() || "Details to be confirmed",
      note:
        String(form.get("note")).trim() ||
        "Visitor information has not yet been provided. Please contact the provider.",
      published: form.get("published") === "on",
    });
  };
  return (
    <form className="listing-form" onSubmit={submit}>
      <p className="small-note">This listing is saved only in this browser.</p>
      {error && (
        <div role="alert" className="form-error">
          {error}
        </div>
      )}
      <label>
        Place name
        <input
          name="name"
          defaultValue={listing?.name}
          required
          maxLength={100}
        />
      </label>
      <div className="form-row">
        <label>
          Listing type
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind)}
          >
            <option value="discover">Attraction</option>
            <option value="stays">Accommodation</option>
            <option value="food">Food & drink</option>
          </select>
        </label>
        <label>
          Region
          <select name="region" defaultValue={listing?.region || "Kuching"}>
            {regions.slice(1).map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          Category
          <select
            key={kind}
            name="category"
            defaultValue={
              listing?.kind === kind ? listing.category : categories[kind][1]
            }
          >
            {categories[kind].slice(1).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Concept image
          <select name="image" defaultValue={listing?.image || "bako"}>
            {[
              "bako",
              "culture",
              "wildlife",
              "hero",
              "cave",
              "stay",
              "food",
              "museum",
              "waterfront",
              "kolo",
              "cafe",
            ].map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Description
        <textarea
          name="description"
          required
          maxLength={1500}
          rows={3}
          defaultValue={listing?.description}
        />
      </label>
      <label>
        Suggested visit time
        <input
          name="duration"
          maxLength={100}
          defaultValue={listing?.duration}
          placeholder="e.g. Allow half a day"
        />
      </label>
      <label>
        Visitor information
        <textarea
          name="note"
          maxLength={1500}
          rows={2}
          defaultValue={listing?.note}
          placeholder="What should visitors check before travelling?"
        />
      </label>
      <label>
        Official / provider website
        <input
          name="url"
          type="url"
          required
          defaultValue={listing?.url}
          placeholder="https://"
          maxLength={1000}
        />
      </label>
      <label className="checkbox-label">
        <input
          name="published"
          type="checkbox"
          defaultChecked={listing?.published ?? true}
        />
        Publish in this browser’s guide
      </label>
      <div className="detail-actions">
        <button
          type="button"
          className="button button-outline"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button className="button button-primary">
          Save listing
          <Check size={16} />
        </button>
      </div>
    </form>
  );
}

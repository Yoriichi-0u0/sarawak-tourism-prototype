export type Kind = "discover" | "stays" | "food";
export type Listing = {
  id: string;
  name: string;
  kind: Kind;
  region: string;
  category: string;
  image: string;
  description: string;
  duration: string;
  note: string;
  url: string;
  published: boolean;
};
const tourism =
  "https://www.sarawaktourism.com/web/places-to-visit/town-view/kuching";
export const seedListings: Listing[] = [
  {
    id: "bako",
    name: "Bako National Park",
    kind: "discover",
    region: "Kuching",
    category: "Nature & wildlife",
    image: "bako",
    description:
      "Coastal trails, sculpted sandstone, and a forest full of surprises. Make room for a slower day exploring one of Sarawak’s most distinctive landscapes.",
    duration: "Allow a full day",
    note: "Boat access is weather dependent. Confirm entry, boat arrangements, and trail conditions with the park before travelling.",
    url: "https://sarawakforestry.com/",
    published: true,
  },
  {
    id: "culture",
    name: "Sarawak Cultural Village",
    kind: "discover",
    region: "Kuching",
    category: "Culture & heritage",
    image: "culture",
    description:
      "Discover traditional architecture and the living cultures of Sarawak at the foot of Mount Santubong. Leave time to explore the houses and ask questions.",
    duration: "Allow half a day",
    note: "Check the operator for current ticket prices, opening hours, and performance schedules.",
    url: "https://scv.com.my/",
    published: true,
  },
  {
    id: "semenggoh",
    name: "Semenggoh Wildlife Centre",
    kind: "discover",
    region: "Kuching",
    category: "Nature & wildlife",
    image: "wildlife",
    description:
      "A chance to learn about orangutans and their forest home. Keep a respectful distance, follow ranger guidance, and let wildlife set the pace.",
    duration: "Allow half a day",
    note: "Wildlife sightings are never guaranteed. Verify visitor sessions and access with Sarawak Forestry.",
    url: "https://sarawakforestry.com/",
    published: true,
  },
  {
    id: "mulu",
    name: "Gunung Mulu National Park",
    kind: "discover",
    region: "Miri",
    category: "Adventure",
    image: "cave",
    description:
      "Vast caves and rainforest adventures reward a little extra planning. Build in travel time and ask the park about the guided experiences that suit you.",
    duration: "Plan a multi-day visit",
    note: "Reserve park activities and check transport independently. This guide does not show live availability.",
    url: "https://mulupark.com/",
    published: true,
  },
  {
    id: "museum",
    name: "Borneo Cultures Museum",
    kind: "discover",
    region: "Kuching",
    category: "Culture & heritage",
    image: "museum",
    description:
      "Take a closer look at Borneo’s communities, stories, and heritage. A thoughtful starting point for understanding the places you will visit.",
    duration: "Allow 2–3 hours",
    note: "Confirm opening hours and admission with the museum. Image is illustrative.",
    url: "https://museum.sarawak.gov.my/",
    published: true,
  },
  {
    id: "waterfront",
    name: "Kuching Waterfront",
    kind: "discover",
    region: "Kuching",
    category: "City escapes",
    image: "waterfront",
    description:
      "Follow the river, pause for a local snack, and watch the city settle into the evening. Pair a leisurely waterfront walk with a visit to nearby heritage streets.",
    duration: "Allow 1–2 hours",
    note: "Public outdoor area. Check local conditions; the image is an illustrative landscape, not an exact view.",
    url: tourism,
    published: true,
  },
  {
    id: "niah",
    name: "Niah National Park",
    kind: "discover",
    region: "Miri",
    category: "Adventure",
    image: "cave",
    description:
      "Explore a remarkable cave landscape with a deep human history. Prepare for walking, carry the essentials, and follow the park’s access guidance.",
    duration: "Allow a full day",
    note: "Check trail access and entry details with the park before visiting. Image is illustrative.",
    url: "https://sarawakforestry.com/",
    published: true,
  },
  {
    id: "kubah",
    name: "Kubah National Park",
    kind: "discover",
    region: "Kuching",
    category: "Nature & wildlife",
    image: "hero",
    description:
      "A green escape for forest walks, palms, and a quieter side of Sarawak. Choose a trail that suits your fitness and the day’s conditions.",
    duration: "Allow half a day",
    note: "Verify trail conditions, entry details, and suitable equipment with the park.",
    url: "https://sarawakforestry.com/",
    published: true,
  },
  {
    id: "riverside-stay",
    name: "Riverside boutique stay",
    kind: "stays",
    region: "Kuching",
    category: "Boutique hotel",
    image: "stay",
    description:
      "An example of a centrally located stay for travellers who enjoy exploring on foot. Compare location, room facilities, and accessibility before choosing.",
    duration: "Flexible stay",
    note: "Illustrative accommodation listing, not a real property or offer. Search the external provider for actual hotels, prices, and availability.",
    url: "https://www.agoda.com/",
    published: true,
  },
  {
    id: "forest-stay",
    name: "Rainforest retreat",
    kind: "stays",
    region: "Kuching",
    category: "Nature retreat",
    image: "culture",
    description:
      "An example of a slower stay surrounded by greenery. Consider transport, meals, and access requirements when planning a retreat outside the city.",
    duration: "Flexible stay",
    note: "Illustrative accommodation listing. No live room inventory, price, or reservation is provided.",
    url: "https://www.agoda.com/",
    published: true,
  },
  {
    id: "miri-stay",
    name: "Coastal city stay",
    kind: "stays",
    region: "Miri",
    category: "City hotel",
    image: "stay",
    description:
      "An example of a comfortable base for exploring Miri and planning onward adventures. Ask the actual provider about airport transfers and room options.",
    duration: "Flexible stay",
    note: "Illustrative accommodation listing. Confirm all facilities, prices, and availability with the actual provider.",
    url: "https://www.agoda.com/",
    published: true,
  },
  {
    id: "laksa",
    name: "A bowl of Sarawak laksa",
    kind: "food",
    region: "Kuching",
    category: "Local favourites",
    image: "food",
    description:
      "Rice vermicelli, a fragrant broth, and a generous topping of prawns, chicken, and omelette. Start your day with one of Kuching’s signature flavours.",
    duration: "A leisurely breakfast",
    note: "Contains common allergens including shellfish and egg. Ingredients vary; ask the vendor about dietary needs.",
    url: "https://www.sarawaktourism.com/web/things-to-do/thing-view/food/local-delicacies/sarawak-laksa",
    published: true,
  },
  {
    id: "kolo",
    name: "Discover kolo mee",
    kind: "food",
    region: "Kuching",
    category: "Local favourites",
    image: "kolo",
    description:
      "Discover another familiar Kuching breakfast: a bowl of noodles prepared in the local style. Explore the city’s food scene and find a vendor that suits your tastes.",
    duration: "A quick local meal",
    note: "The image illustrates local dining, not this exact dish. Ask the vendor about ingredients, halal status, and allergens.",
    url: tourism,
    published: true,
  },
  {
    id: "local-dining",
    name: "Explore local food & cafés",
    kind: "food",
    region: "Kuching",
    category: "Cafés & dining",
    image: "cafe",
    description:
      "Make space between adventures to discover local cafés and traditional flavours. Follow your interests and check dietary requirements directly with each venue.",
    duration: "Take your time",
    note: "This is a discovery guide, not a restaurant booking. Menus, operating hours, and dietary suitability need confirmation.",
    url: tourism,
    published: true,
  },
];
export const regions = ["All regions", "Kuching", "Miri"];
export const categories: Record<Kind, string[]> = {
  discover: [
    "All experiences",
    "Nature & wildlife",
    "Culture & heritage",
    "Adventure",
    "City escapes",
  ],
  stays: ["All stays", "Boutique hotel", "Nature retreat", "City hotel"],
  food: ["All flavours", "Local favourites", "Cafés & dining"],
};
export const pageCopy: Record<
  Kind,
  { title: string; subtitle: string; section: string }
> = {
  discover: {
    title: "A little wild. A lot to discover.",
    subtitle:
      "Rainforests, living cultures, and flavours worth travelling for. Find your kind of Sarawak.",
    section: "Places that stay with you",
  },
  stays: {
    title: "Somewhere to slow down.",
    subtitle:
      "A city base or a forest escape. Find a stay that fits the way you travel.",
    section: "Make yourself at home",
  },
  food: {
    title: "Follow your appetite.",
    subtitle:
      "From a first bowl of laksa to a long, leisurely lunch. Get to know Sarawak through its flavours.",
    section: "A taste of something local",
  },
};

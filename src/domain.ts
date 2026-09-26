import type { Listing } from "./data";
export type TripItem = { id: string; day: number; note: string };
export type Trip = {
  name: string;
  start: string;
  days: number;
  items: TripItem[];
};
export const emptyTrip: Trip = {
  name: "My Sarawak adventure",
  start: "",
  days: 3,
  items: [],
};
export function dateForDay(start: string, day: number) {
  const date = new Date(`${start}T12:00:00`);
  date.setDate(date.getDate() + day);
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}
function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function dayNeighbor(
  items: TripItem[],
  index: number,
  direction: number,
) {
  const day = items[index]?.day;
  if (day === undefined) return -1;
  for (let i = index + direction; i >= 0 && i < items.length; i += direction)
    if (items[i].day === day) return i;
  return -1;
}
export function filterListings(
  list: Listing[],
  kind: string,
  query: string,
  region: string,
  category: string,
  sort: string,
) {
  const result = list.filter(
    (l) =>
      l.published &&
      l.kind === kind &&
      (!query ||
        `${l.name} ${l.description} ${l.region} ${l.category}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())) &&
      (region === "All regions" || l.region === region) &&
      (category.startsWith("All ") || l.category === category),
  );
  return sort === "Name A–Z"
    ? [...result].sort((a, b) => a.name.localeCompare(b.name))
    : result;
}
export function normalizeTrip(
  value: unknown,
  validIds: Set<string>,
): Trip | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<Trip>;
  if (
    typeof v.name !== "string" ||
    typeof v.days !== "number" ||
    !Number.isInteger(v.days) ||
    v.days < 1 ||
    v.days > 14 ||
    !Array.isArray(v.items) ||
    v.items.length > 100
  )
    return null;
  const seen = new Set<string>();
  const items = v.items
    .filter(
      (i) =>
        i &&
        typeof i.id === "string" &&
        validIds.has(i.id) &&
        Number.isInteger(i.day) &&
        i.day >= 1 &&
        i.day <= v.days! &&
        !seen.has(i.id) &&
        !!seen.add(i.id),
    )
    .map((i) => ({
      id: i.id,
      day: i.day,
      note: typeof i.note === "string" ? i.note.slice(0, 500) : "",
    }));
  return {
    name: v.name.slice(0, 80),
    days: v.days,
    start: validDate(v.start) ? v.start : "",
    items,
  };
}
export function encodeTrip(trip: Trip) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(trip))));
}
export function decodeTrip(value: string, validIds: Set<string>) {
  try {
    if (value.length > 30000) return null;
    return normalizeTrip(
      JSON.parse(decodeURIComponent(escape(atob(value)))),
      validIds,
    );
  } catch {
    return null;
  }
}
export function safeProvider(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

import test from "node:test";
import assert from "node:assert/strict";
import { seedListings } from "./data.ts";
import {
  dateForDay,
  dayNeighbor,
  decodeTrip,
  emptyTrip,
  encodeTrip,
  filterListings,
  normalizeTrip,
  safeProvider,
} from "./domain.ts";
const ids = new Set(seedListings.map((l) => l.id));
test("search combines category, region, publication status and partial names", () => {
  assert.deepEqual(
    filterListings(
      seedListings,
      "discover",
      "bako",
      "Kuching",
      "Nature & wildlife",
      "Recommended",
    ).map((l) => l.id),
    ["bako"],
  );
  assert.equal(
    filterListings(
      seedListings,
      "discover",
      "bako",
      "Miri",
      "Nature & wildlife",
      "Recommended",
    ).length,
    0,
  );
  assert.equal(
    filterListings(
      seedListings.map((l) => ({ ...l, published: false })),
      "discover",
      "",
      "All regions",
      "All experiences",
      "Recommended",
    ).length,
    0,
  );
});
test("shared itinerary round-trips unicode notes and removes unknown and duplicate places", () => {
  const trip = {
    ...emptyTrip,
    name: "Sarawak 🌿",
    items: [
      { id: "bako", day: 2, note: "Café after the walk" },
      { id: "bako", day: 1, note: "" },
      { id: "not-a-place", day: 1, note: "" },
    ],
  };
  assert.deepEqual(decodeTrip(encodeTrip(trip), ids), {
    ...trip,
    items: [trip.items[0]],
  });
});
test("malformed, oversized, and invalid shared itineraries fail safely", () => {
  for (const value of [
    "not base64",
    "x".repeat(31000),
    encodeTrip({ ...emptyTrip, days: 99 }),
    encodeTrip({ ...emptyTrip, days: 1.5 }),
  ])
    assert.equal(decodeTrip(value, ids), null);
  assert.equal(
    normalizeTrip({ ...emptyTrip, start: "2026-99-99" }, ids)?.start,
    "",
  );
  assert.equal(
    normalizeTrip({ ...emptyTrip, start: "2026-02-30" }, ids)?.start,
    "",
  );
  assert.deepEqual(
    normalizeTrip(
      {
        ...emptyTrip,
        items: [
          { id: "bako", day: 0, note: "" },
          { id: "culture", day: 15, note: "" },
        ],
      },
      ids,
    )?.items,
    [],
  );
});
test("day labels advance across month boundaries", () => {
  assert.match(dateForDay("2026-09-30", 0), /30 Sept/);
  assert.match(dateForDay("2026-09-30", 1), /1 Oct/);
});
test("reordering finds the next place in a day even when another day is interleaved", () => {
  const items = [
    { id: "bako", day: 1, note: "" },
    { id: "culture", day: 2, note: "" },
    { id: "semenggoh", day: 1, note: "" },
  ];
  assert.equal(dayNeighbor(items, 0, 1), 2);
  assert.equal(dayNeighbor(items, 2, -1), 0);
  assert.equal(dayNeighbor(items, 1, 1), -1);
});
test("provider links require HTTPS and reject script and local file URLs", () => {
  assert.equal(safeProvider("javascript:alert(1)"), null);
  assert.equal(safeProvider("file:///tmp/file"), null);
  assert.equal(safeProvider("http://example.com"), null);
  assert.equal(
    safeProvider("https://www.sarawaktourism.com/"),
    "https://www.sarawaktourism.com/",
  );
});

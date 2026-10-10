// Tests for pairing list entries by identity (never by position), so reordering is not a change.
import { describe, expect, it } from "vitest";
import { matchByIdentity } from "./matchByIdentity";

type Attendee = { name: string; diet: string };
const byName = (attendee: Attendee) => attendee.name;

describe("matchByIdentity", () => {
  it("pairs entries with the same identity regardless of order", () => {
    const before = [{ name: "Anna", diet: "" }, { name: "Ben", diet: "" }];
    const after = [{ name: "Ben", diet: "vegan" }, { name: "Anna", diet: "" }];
    const result = matchByIdentity(before, after, byName);
    expect(result.pairs).toEqual([
      [before[0], after[1]],
      [before[1], after[0]],
    ]);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  it("matches identities after normalization", () => {
    const result = matchByIdentity([{ name: "Anna  Lind", diet: "" }], [{ name: "anna lind ", diet: "" }], byName);
    expect(result.pairs).toHaveLength(1);
  });

  it("reports unmatched entries as added and removed", () => {
    const result = matchByIdentity([{ name: "Anna", diet: "" }], [{ name: "Hugo", diet: "" }], byName);
    expect(result.removed).toEqual([{ name: "Anna", diet: "" }]);
    expect(result.added).toEqual([{ name: "Hugo", diet: "" }]);
  });

  it("pairs duplicate identities in order", () => {
    const before = [{ name: "Sam", diet: "vegan" }, { name: "Sam", diet: "" }];
    const after = [{ name: "Sam", diet: "vegan" }];
    const result = matchByIdentity(before, after, byName);
    expect(result.pairs).toEqual([[before[0], after[0]]]);
    expect(result.removed).toEqual([before[1]]);
  });
});

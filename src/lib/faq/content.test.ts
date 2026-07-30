import { describe, it, expect } from "vitest";
import {
  FAQ_ENTRIES,
  FAQ_CATEGORIES,
  publishedEntries,
  groupedEntries,
  hasVisibleEntries,
  draftCount,
  type FaqEntry,
} from "./content";

const entry = (over: Partial<FaqEntry>): FaqEntry => ({
  id: "x",
  category: "getting-started",
  question: "Q?",
  answer: ["A."],
  reviewStatus: "draft",
  ...over,
});

describe("publishedEntries", () => {
  // The safeguard this whole module exists for: unreviewed wording must not be
  // published on a legal-adjacent product.
  it("hides draft entries in production", () => {
    const entries = [entry({ id: "a" }), entry({ id: "b", reviewStatus: "approved" })];
    const out = publishedEntries(entries, "production");
    expect(out.map((e) => e.id)).toEqual(["b"]);
  });

  it("shows draft entries outside production so they can be reviewed", () => {
    const entries = [entry({ id: "a" }), entry({ id: "b", reviewStatus: "approved" })];
    expect(publishedEntries(entries, "development")).toHaveLength(2);
    expect(publishedEntries(entries, "test")).toHaveLength(2);
  });

  it("publishes nothing in production when everything is still draft", () => {
    expect(publishedEntries([entry({}), entry({ id: "y" })], "production")).toEqual([]);
  });

  // The pre-launch escape hatch, so counsel can read the answers on a deployed
  // site rather than in a git diff.
  it("shows drafts in production when the preview flag is exactly 'true'", () => {
    const entries = [entry({ id: "a" })];
    expect(publishedEntries(entries, "production", "true")).toHaveLength(1);
  });

  it("ignores any other value for the preview flag", () => {
    const entries = [entry({ id: "a" })];
    for (const v of ["1", "yes", "TRUE", "", undefined]) {
      expect(publishedEntries(entries, "production", v)).toEqual([]);
    }
  });
});

describe("hasVisibleEntries", () => {
  it("is false in production while everything is draft", () => {
    expect(hasVisibleEntries(FAQ_ENTRIES, "production", undefined)).toBe(false);
  });

  it("is true once an entry is approved", () => {
    expect(
      hasVisibleEntries([entry({ reviewStatus: "approved" })], "production", undefined),
    ).toBe(true);
  });

  it("is true under the preview flag", () => {
    expect(hasVisibleEntries(FAQ_ENTRIES, "production", "true")).toBe(true);
  });
});

describe("groupedEntries", () => {
  it("returns categories in the declared order", () => {
    const entries = [
      entry({ id: "b", category: "pricing", reviewStatus: "approved" }),
      entry({ id: "a", category: "getting-started", reviewStatus: "approved" }),
    ];
    expect(groupedEntries(entries, "production").map((g) => g.key)).toEqual([
      "getting-started",
      "pricing",
    ]);
  });

  it("drops categories with no visible entries", () => {
    const entries = [entry({ id: "a", category: "pricing", reviewStatus: "approved" })];
    const groups = groupedEntries(entries, "production");
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("pricing");
  });

  it("is empty in production while everything is draft", () => {
    expect(groupedEntries(FAQ_ENTRIES, "production")).toEqual([]);
  });
});

describe("the real content", () => {
  it("has a unique id for every entry", () => {
    const ids = FAQ_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses declared categories", () => {
    const known = new Set(FAQ_CATEGORIES.map((c) => c.key));
    for (const e of FAQ_ENTRIES) expect(known.has(e.category)).toBe(true);
  });

  it("gives every category at least one entry", () => {
    const used = new Set(FAQ_ENTRIES.map((e) => e.category));
    for (const c of FAQ_CATEGORIES) expect(used.has(c.key)).toBe(true);
  });

  it("has a question and at least one answer paragraph everywhere", () => {
    for (const e of FAQ_ENTRIES) {
      expect(e.question.trim().length).toBeGreaterThan(0);
      expect(e.answer.length).toBeGreaterThan(0);
      for (const p of e.answer) expect(p.trim().length).toBeGreaterThan(0);
    }
  });

  // Everything starts unapproved. This test is expected to change as counsel signs
  // entries off — it exists so that flipping one is a deliberate, reviewed act.
  it("has every entry awaiting review", () => {
    expect(draftCount()).toBe(FAQ_ENTRIES.length);
  });

  it("carries no attorney-review placeholder markers", () => {
    for (const e of FAQ_ENTRIES) {
      expect(e.answer.join(" ")).not.toContain("ATTORNEY REVIEW REQUIRED");
    }
  });

  // The UPL posture is the reason this page is safe to publish at all.
  it("states plainly that we are not a law firm", () => {
    const notALawFirm = FAQ_ENTRIES.find((e) => e.id === "not-a-law-firm");
    expect(notALawFirm).toBeDefined();
    expect(notALawFirm?.answer.join(" ")).toContain("not a law firm");
  });

  it("declines to recommend a package", () => {
    const which = FAQ_ENTRIES.find((e) => e.id === "which-should-i-choose");
    expect(which).toBeDefined();
    expect(which?.answer.join(" ").toLowerCase()).toContain("legal advice");
  });

  it("never tells the reader what they should choose", () => {
    const banned = /\byou should (choose|pick|select|get|buy)\b/i;
    for (const e of FAQ_ENTRIES) {
      expect(banned.test(e.answer.join(" "))).toBe(false);
    }
  });
});

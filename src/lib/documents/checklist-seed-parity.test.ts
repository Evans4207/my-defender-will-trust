import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The legal review checklist is written for counsel, and item B6 makes a
 * countable claim about the seed: how many jurisdictions are seeded as
 * permitting electronic wills.
 *
 * That claim went stale and shipped wrong. B6 read "Seeded as not permitted
 * anywhere" while the seed marked 15 jurisdictions permitted — caught in the
 * compliance dossier on 2 Aug 2026 and still uncorrected on 30 Aug, because
 * keeping the two in step depended on a person remembering to. The checklist is
 * the document counsel signs off from, so a wrong number in it is worse than a
 * wrong number almost anywhere else in the repo.
 *
 * This test removes the remembering. Change the seed and B6 must be updated in
 * LEGAL_REVIEW_CHECKLIST.docx (canonical) and regenerated with
 * `npm run checklist:md`, or the build fails.
 */
const ROOT = join(__dirname, "../../..");

const seed = readFileSync(join(ROOT, "supabase/seed.sql"), "utf8");
const checklist = readFileSync(join(ROOT, "docs/LEGAL_REVIEW_CHECKLIST.md"), "utf8");

const permittedStates = [
  ...seed.matchAll(
    /\('([A-Z]{2})', 'will', 'electronic_will_permitted', '\{"permitted":true/g,
  ),
].map((m) => m[1]);

const b6 = checklist.split("\n").find((l) => l.startsWith("| **B6**")) ?? "";

describe("checklist B6 matches the seed", () => {
  it("finds the B6 row and some permitted states", () => {
    expect(b6).not.toBe("");
    expect(permittedStates.length).toBeGreaterThan(0);
  });

  it("states the correct number of permitted jurisdictions", () => {
    expect(b6).toContain(`PERMITTED in ${permittedStates.length} jurisdictions`);
  });

  it("names every permitted jurisdiction", () => {
    for (const state of permittedStates) {
      expect(b6, `B6 does not name ${state}`).toMatch(
        new RegExp(`\\b${state}\\b`),
      );
    }
  });

  it("does not name a jurisdiction the seed marks not permitted", () => {
    const listed = (b6.match(/PERMITTED in \d+ jurisdictions — ([A-Z, ]+) —/) ?? [])[1];
    expect(listed).toBeTruthy();
    const named = listed.split(",").map((s) => s.trim()).filter(Boolean);
    expect(named.sort()).toEqual([...permittedStates].sort());
  });
});

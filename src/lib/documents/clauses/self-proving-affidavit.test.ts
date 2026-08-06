import { describe, it, expect } from "vitest";
import { selfProvingAffidavitFor, researchedStates } from "./self-proving-affidavit";
import { needsAttorneyReview, provenanceLine } from "../clause-provenance";

const ctx = {
  testatorName: "Jane Doe",
  stateName: "Arizona",
  witnessCount: 2,
  requiresNotary: true,
};

describe("self-proving affidavit clause library", () => {
  it("returns researched, cited text for Arizona", () => {
    const c = selfProvingAffidavitFor("AZ", ctx);
    expect(c.provenance.status).toBe("researched");
    expect(c.provenance.citation).toContain("14-2504");
    expect(c.provenance.fidelity).toBe("statutory_sample");
    expect(c.provenance.sourceUrl).toContain("azleg.gov");
  });

  it("carries all six facts the Arizona statute requires of the witnesses", () => {
    const witnessPara = selfProvingAffidavitFor("AZ", ctx).paragraphs[1].toLowerCase();
    // A.R.S. § 14-2504(A) — the witnesses must establish each of these.
    expect(witnessPara).toContain("signs and executes"); // (a) executed as their will
    expect(witnessPara).toContain("willingly"); // (b) signed willingly
    expect(witnessPara).toContain("presence and hearing"); // (c) signed before testator
    expect(witnessPara).toContain("eighteen years of age or older"); // (d) age
    expect(witnessPara).toContain("sound mind"); // (e) capacity
    expect(witnessPara).toContain("no constraint or undue influence"); // (f) no duress
  });

  it("includes the officer certificate and official seal Arizona requires", () => {
    const c = selfProvingAffidavitFor("AZ", ctx);
    expect(c.paragraphs.join(" ")).toContain("Subscribed, sworn to and acknowledged");
    expect(c.signatureLines.join(" ")).toContain("Official seal");
    expect(c.paragraphs.join(" ")).toContain("The State of");
  });

  it("scales the witness block to the state's required witness count", () => {
    const c = selfProvingAffidavitFor("AZ", { ...ctx, witnessCount: 3 });
    expect(c.signatureLines.filter((l) => l.startsWith("Witness"))).toHaveLength(3);
  });

  it("falls back to a conservative placeholder for unresearched states", () => {
    const c = selfProvingAffidavitFor("NY", { ...ctx, stateName: "New York" });
    expect(c.provenance.status).toBe("placeholder");
    // Must NOT invent statutory language for a state we have not researched.
    expect(c.paragraphs.join(" ")).not.toMatch(/duly sworn|undersigned authority/i);
  });

  it("keeps every clause flagged for counsel until approved", () => {
    for (const state of ["AZ", "NY"]) {
      const c = selfProvingAffidavitFor(state, ctx);
      expect(needsAttorneyReview(c.provenance)).toBe(true);
    }
  });

  it("reports researched states and renders an audit line", () => {
    expect(researchedStates()).toContain("AZ");
    const prov = selfProvingAffidavitFor("AZ", ctx).provenance;
    const line = provenanceLine(prov);
    // The retrieval date is asserted against the capture's own value, not a
    // literal. Hardcoding it made this test fail every time the harvester ran.
    expect(prov.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(line).toMatch(
      new RegExp(`14-2504.*researched.*statutory sample.*${prov.checkedAt}`),
    );
  });
});

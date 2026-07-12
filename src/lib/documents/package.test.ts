import { describe, it, expect } from "vitest";
import { documentKindsFor } from "./package";

describe("documentKindsFor", () => {
  it("Will package = will + POA + healthcare + HIPAA", () => {
    expect(documentKindsFor("will")).toEqual(["will", "poa", "healthcare", "hipaa"]);
  });

  it("Trust package = trust + pour-over will + POA + healthcare + HIPAA", () => {
    expect(documentKindsFor("trust")).toEqual([
      "trust",
      "pourover",
      "poa",
      "healthcare",
      "hipaa",
    ]);
  });
});

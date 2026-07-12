import { describe, it, expect } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("joins headers and rows", () => {
    expect(toCsv(["a", "b"], [[1, 2], [3, 4]])).toBe("a,b\n1,2\n3,4");
  });

  it("quotes fields containing commas, quotes, or newlines", () => {
    expect(toCsv(["x"], [["a,b"]])).toBe('x\n"a,b"');
    expect(toCsv(["x"], [['he said "hi"']])).toBe('x\n"he said ""hi"""');
    expect(toCsv(["x"], [["line1\nline2"]])).toBe('x\n"line1\nline2"');
  });

  it("renders null/undefined as empty", () => {
    expect(toCsv(["a", "b"], [[null, undefined]])).toBe("a,b\n,");
  });
});

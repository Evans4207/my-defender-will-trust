import { describe, it, expect } from "vitest";
import {
  normalizeAccessCode,
  isValidAccessCodeFormat,
  CODE_ALPHABET,
} from "./access-code";

describe("normalizeAccessCode", () => {
  it("re-inserts canonical dashes and uppercases", () => {
    expect(normalizeAccessCode("dfndabcd2345")).toBe("DFND-ABCD-2345");
    expect(normalizeAccessCode("DFND abcd 2345")).toBe("DFND-ABCD-2345");
    expect(normalizeAccessCode("dfnd-abcd-2345")).toBe("DFND-ABCD-2345");
  });
});

describe("isValidAccessCodeFormat", () => {
  it("accepts a well-formed code", () => {
    expect(isValidAccessCodeFormat("DFND-ABCD-2345")).toBe(true);
  });

  it("rejects ambiguous characters (0/O/1/I/L)", () => {
    expect(isValidAccessCodeFormat("DFND-ABC0-2345")).toBe(false);
    expect(isValidAccessCodeFormat("DFND-ABCI-2345")).toBe(false);
    expect(isValidAccessCodeFormat("DFND-ABCL-2345")).toBe(false);
  });

  it("rejects wrong prefix / length", () => {
    expect(isValidAccessCodeFormat("CODE-ABCD-2345")).toBe(false);
    expect(isValidAccessCodeFormat("DFND-ABCD-234")).toBe(false);
    expect(isValidAccessCodeFormat("DFND-ABCD2345")).toBe(false);
  });

  it("alphabet excludes confusable characters", () => {
    for (const ch of ["0", "O", "1", "I", "L"]) {
      expect(CODE_ALPHABET.includes(ch)).toBe(false);
    }
  });
});

import { describe, expect, it } from "vitest";
import { parseLengthToInches } from "@/lib/parseLength";

describe("parseLengthToInches", () => {
  it("parses feet-only", () => {
    expect(parseLengthToInches("12'")).toBe(144);
    expect(parseLengthToInches("12 ft")).toBe(144);
    expect(parseLengthToInches("12feet")).toBe(144);
  });
  it("parses inches-only", () => {
    expect(parseLengthToInches('148"')).toBe(148);
    expect(parseLengthToInches("148 in")).toBe(148);
    expect(parseLengthToInches("148 inches")).toBe(148);
  });
  it("parses combined", () => {
    expect(parseLengthToInches(`12' 4"`)).toBe(148);
    expect(parseLengthToInches(`12'4"`)).toBe(148);
    expect(parseLengthToInches(`12 ft 4 in`)).toBe(148);
  });
  it("accepts bare numbers as inches", () => {
    expect(parseLengthToInches("60")).toBe(60);
    expect(parseLengthToInches("60.5")).toBe(60.5);
  });
  it("returns null for invalid input", () => {
    expect(parseLengthToInches("")).toBeNull();
    expect(parseLengthToInches("abc")).toBeNull();
    expect(parseLengthToInches("10m")).toBeNull();
    expect(parseLengthToInches("0")).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { isValidUid, sanitizeUidInput } from "../../src/lib/uid";

describe("isValidUid", () => {
  it("accepts a nine-digit UID starting with 1-9", () => {
    expect(isValidUid("700600838")).toBe(true);
    expect(isValidUid("600123456")).toBe(true);
    expect(isValidUid("812345678")).toBe(true);
  });

  it("accepts the ten-digit Asia UIDs that start with 18", () => {
    expect(isValidUid("1812345678")).toBe(true);
  });

  it("rejects ten digits that do not start with 18", () => {
    expect(isValidUid("1234567890")).toBe(false);
    expect(isValidUid("7006008380")).toBe(false);
  });

  it("rejects UIDs starting with 0", () => {
    expect(isValidUid("012345678")).toBe(false);
  });

  it("rejects the wrong length", () => {
    expect(isValidUid("12345678")).toBe(false);
    expect(isValidUid("18123456789")).toBe(false);
    expect(isValidUid("")).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(isValidUid("abc123456")).toBe(false);
    expect(isValidUid("70060083a")).toBe(false);
  });
});

describe("sanitizeUidInput", () => {
  it("removes non-digit characters", () => {
    expect(sanitizeUidInput("700-600-838")).toBe("700600838");
    expect(sanitizeUidInput(" abc123def ")).toBe("123");
  });

  it("keeps a ten-digit UID whole and truncates beyond it", () => {
    expect(sanitizeUidInput("1812345678")).toBe("1812345678");
    expect(sanitizeUidInput("18123456789")).toBe("1812345678");
  });
});

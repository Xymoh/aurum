import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { readRecentUids, rememberUid } from "../../src/hooks/useRecentUids";

const KEY = "test-recent";

/**
 * The test DOM's storage is an opaque-origin stub without the Storage
 * methods, so the tests bring a real in-memory one.
 */
const store = new Map<string, string>();
const memoryStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
};

describe("recent UIDs", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", { value: memoryStorage, configurable: true });
  });
  beforeEach(() => store.clear());

  it("remembers the newest first, unique and bounded", () => {
    for (let i = 0; i < 12; i++) rememberUid(KEY, String(700000000 + i));
    rememberUid(KEY, "700000005");
    const list = readRecentUids(KEY);
    expect(list).toHaveLength(10);
    expect(list[0].uid).toBe("700000005");
    expect(new Set(list.map((e) => e.uid)).size).toBe(10);
  });

  it("drops entries that are not a UID and a timestamp instead of crashing", () => {
    window.localStorage.setItem("aurum:" + KEY, JSON.stringify([{ uid: 12 }, null, "x", { uid: "700600838", timestamp: 1 }]));
    expect(readRecentUids(KEY)).toEqual([{ uid: "700600838", timestamp: 1 }]);
    window.localStorage.setItem("aurum:" + KEY, "{not json");
    expect(readRecentUids(KEY)).toEqual([]);
  });

  it("still reads a list saved under the old unprefixed key", () => {
    window.localStorage.setItem(KEY, JSON.stringify([{ uid: "700600838", timestamp: 1 }]));
    expect(readRecentUids(KEY)[0].uid).toBe("700600838");
  });
});

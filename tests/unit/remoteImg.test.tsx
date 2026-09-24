import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RemoteImg } from "../../src/components/ui/RemoteImg";
import { retryUrls } from "../../src/lib/remoteImage";

// React warns about act() outside a test environment that declares it.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("retryUrls", () => {
  it("moves a jsDelivr file to jsDelivr's other network", () => {
    expect(retryUrls("https://cdn.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/character_preview/1507.png")).toEqual([
      "https://fastly.jsdelivr.net/gh/Mar-7th/StarRailRes@master/image/character_preview/1507.png",
    ]);
  });

  it("asks any other host again, with a query so the browser makes a real request", () => {
    expect(retryUrls("https://enka.network/ui/UI_AvatarIcon_Hutao.png")).toEqual(["https://enka.network/ui/UI_AvatarIcon_Hutao.png?retry=1"]);
    expect(retryUrls("/aurum/zzz/items/IconCoin.webp?v=2")).toEqual(["/aurum/zzz/items/IconCoin.webp?v=2&retry=1"]);
  });

  it("does not retry a picture that is already in memory", () => {
    expect(retryUrls("data:image/png;base64,AAAA")).toEqual([]);
    expect(retryUrls("blob:http://localhost/1234")).toEqual([]);
  });
});

describe("RemoteImg", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  const img = () => container.querySelector("img") as HTMLImageElement;
  const src = () => img().getAttribute("src");
  const fail = () => act(() => void img().dispatchEvent(new Event("error")));

  it("asks again after a pause, then settles for a fallback, and only then gives up", () => {
    const onError = vi.fn();
    act(() => root.render(<RemoteImg src="https://enka.network/ui/a.png" fallbacks={["https://enka.network/ui/b.png"]} alt="" onError={onError} />));
    expect(src()).toBe("https://enka.network/ui/a.png");

    fail();
    expect(src()).toBe("https://enka.network/ui/a.png");
    act(() => void vi.advanceTimersByTime(1200));
    expect(src()).toBe("https://enka.network/ui/a.png?retry=1");

    fail();
    expect(src()).toBe("https://enka.network/ui/b.png");
    expect(onError).not.toHaveBeenCalled();

    fail();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("tries an alternate name at once, before any retry", () => {
    act(() => root.render(<RemoteImg src="https://enka.network/ui/UI_Talent_U_Hutao_01.png" alternates={["https://enka.network/ui/UI_Talent_S_Hutao_03.png"]} alt="" />));
    fail();
    expect(src()).toBe("https://enka.network/ui/UI_Talent_S_Hutao_03.png");
  });

  it("starts a different picture from its own first URL", () => {
    act(() => root.render(<RemoteImg src="https://enka.network/ui/a.png" alt="" />));
    fail();
    act(() => void vi.advanceTimersByTime(1200));
    expect(src()).toBe("https://enka.network/ui/a.png?retry=1");

    act(() => root.render(<RemoteImg src="https://enka.network/ui/c.png" alt="" />));
    expect(src()).toBe("https://enka.network/ui/c.png");
  });
});

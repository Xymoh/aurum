import type { Dictionary } from "../i18n/locales/en";

export type HelpGame = "genshin" | "hsr" | "zzz";

type HelpKey = keyof Dictionary["help"];

export interface HelpStep {
  /** The instruction. */
  text: HelpKey;
  /** File under public/help/<game>/; shown when present, placeholder otherwise. */
  image: string;
  /** What the screenshot should show, so the placeholder says what to capture. */
  capture: HelpKey;
}

export interface HelpSkin {
  panel: string;
  inset: string;
  text: string;
  muted: string;
  accent: string;
  accentBg: string;
  line: string;
  link: string;
  /** The banner's surface, warm rather than alarming: nothing is broken. */
  banner: string;
}

export interface HelpContent {
  game: HelpGame;
  home: string;
  path: string;
  intro: HelpKey;
  steps: HelpStep[];
  /** The "still not seeing them?" checklist, in the order worth trying. */
  checks: HelpKey[];
  bannerBody: HelpKey;
  skin: HelpSkin;
}

/**
 * Whether the showcase guides ship. Off until their screenshots exist: a
 * guide made of placeholder boxes reads as a broken page, not a guide. Set
 * VITE_SHOWCASE_HELP=on to enable the routes, the banner and every link to
 * them; with it off the routes fall through to the 404 page.
 */
export const SHOWCASE_HELP = import.meta.env.VITE_SHOWCASE_HELP === "on";

export const HELP_PATH: Record<HelpGame, string> = {
  genshin: "/genshin/help/showcase",
  hsr: "/hsr/help/showcase",
  zzz: "/zzz/help/showcase",
};

/**
 * One guide per game. The steps mirror what the empty state already says,
 * with a picture each, and the checklist covers the ways a showcase can look
 * set up and still come back empty.
 */
export const HELP_CONTENT: Record<HelpGame, HelpContent> = {
  genshin: {
    game: "genshin",
    home: "/genshin",
    path: HELP_PATH.genshin,
    intro: "giIntro",
    steps: [
      { text: "giStep1", image: "01-profile-card.png", capture: "giCapture1" },
      { text: "giStep2", image: "02-character-showcase.png", capture: "giCapture2" },
      { text: "giStep3", image: "03-show-details.png", capture: "giCapture3" },
      { text: "giStep4", image: "04-refresh.png", capture: "giCapture4" },
    ],
    checks: ["checkWait", "giCheckGear", "checkSwapped", "checkUid", "checkNew", "checkPrivacy"],
    bannerBody: "giBannerBody",
    skin: {
      panel: "border-dark-border bg-dark-card/40",
      inset: "border-dark-border bg-dark-bg/60",
      text: "text-dark-text",
      muted: "text-dark-muted",
      accent: "text-accent",
      accentBg: "bg-accent/15 text-accent",
      line: "border-dark-border",
      link: "text-accent underline underline-offset-2 hover:opacity-80",
      banner: "border-accent/30 bg-accent/10 text-dark-text",
    },
  },
  hsr: {
    game: "hsr",
    home: "/hsr",
    path: HELP_PATH.hsr,
    intro: "hsrIntro",
    steps: [
      { text: "hsrStep1", image: "01-profile.png", capture: "hsrCapture1" },
      { text: "hsrStep2", image: "02-character-showcase.png", capture: "hsrCapture2" },
      { text: "hsrStep3", image: "03-display-details.png", capture: "hsrCapture3" },
      { text: "hsrStep4", image: "04-refresh.png", capture: "hsrCapture4" },
    ],
    checks: ["checkWait", "hsrCheckGear", "checkSwapped", "checkUid", "checkNew", "checkPrivacy"],
    bannerBody: "hsrBannerBody",
    skin: {
      panel: "border-hsr-border bg-hsr-panel/40",
      inset: "border-hsr-border bg-hsr-inset/60",
      text: "text-hsr-text",
      muted: "text-hsr-muted",
      accent: "text-hsr-accent",
      accentBg: "bg-hsr-accent/15 text-hsr-accent",
      line: "border-hsr-border",
      link: "text-hsr-accent underline underline-offset-2 hover:text-hsr-text",
      banner: "border-hsr-accent/30 bg-hsr-accent/10 text-hsr-text",
    },
  },
  zzz: {
    game: "zzz",
    home: "/zzz",
    path: HELP_PATH.zzz,
    intro: "zzzIntro",
    steps: [
      { text: "zzzStep1", image: "01-inter-knot-profile.png", capture: "zzzCapture1" },
      { text: "zzzStep2", image: "02-agent-showcase.png", capture: "zzzCapture2" },
      { text: "zzzStep3", image: "03-display-details.png", capture: "zzzCapture3" },
      { text: "zzzStep4", image: "04-refresh.png", capture: "zzzCapture4" },
    ],
    checks: ["checkWait", "zzzCheckGear", "checkSwapped", "checkUid", "checkNew", "checkPrivacy"],
    bannerBody: "zzzBannerBody",
    skin: {
      panel: "border-zzz-border bg-zzz-panel/40",
      inset: "border-zzz-border bg-zzz-inset/60",
      text: "text-zzz-text",
      muted: "text-zzz-muted",
      accent: "text-zzz-accent",
      accentBg: "bg-zzz-accent/20 text-zzz-accent",
      line: "border-zzz-border",
      link: "text-zzz-accent underline underline-offset-2 hover:text-zzz-text",
      banner: "border-zzz-accent/40 bg-zzz-accent/10 text-zzz-text",
    },
  },
};

/** Public URL of a help screenshot, honouring the GitHub Pages base path. */
export function helpImageUrl(game: HelpGame, file: string): string {
  return `${import.meta.env.BASE_URL}help/${game}/${file}`;
}

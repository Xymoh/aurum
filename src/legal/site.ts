/**
 * Facts the legal pages quote. Kept in one place so a change of hosting,
 * contact route or proxy provider is a one-line edit rather than a hunt
 * through two pages of prose.
 */

export const SITE_NAME = "Aurum";
export const SITE_URL = "https://xymoh.github.io/aurum/";
export const OPERATOR = "Xymoh";
export const REPO_URL = "https://github.com/Xymoh/aurum";
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;
export const NOTICES_URL = `${REPO_URL}/blob/main/THIRD_PARTY_NOTICES.md`;

/**
 * Where privacy requests, takedown notices and questions go. GitHub issues
 * work without publishing a personal email address; swap in a mailto: link
 * if you would rather be reached that way.
 */
export const CONTACT_URL = "https://github.com/Xymoh/aurum/issues";

/**
 * Where a visitor can chip in for hosting. Donations, not a paid tier: the
 * site stays free and non-commercial, which is what the fan-content rules
 * it runs under and its own Terms require.
 */
export const SUPPORT_URL = "https://ko-fi.com/saekimon";
export const CONTACT_LABEL = "the project's GitHub issues";

/** Shown on both pages. Bump it whenever either page changes in substance. */
export const EFFECTIVE_DATE = "24 September 2026";

export const PRIVACY_PATH = "/privacy";
export const TERMS_PATH = "/terms";

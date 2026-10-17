import { Link } from "react-router-dom";
import { Ext, LegalLayout, Section } from "./LegalLayout";
import { CONTACT_LABEL, CONTACT_URL, OPERATOR, SITE_NAME, SITE_URL, TERMS_PATH } from "./site";

/**
 * What the site does with data, in plain language.
 *
 * Every claim here must stay true of the code: the site sets no cookies,
 * runs no analytics, keeps no server of its own, and sends a lookup only to
 * the operator's Cloudflare Worker and from there to Enka.Network. What it
 * keeps in local storage is listed in section 6 (src/lib/history.ts,
 * src/hooks/useRecentUids.ts, theme and language). Anyone adding a tracker,
 * a stored item, a new CDN or a new proxy must update this page in the same
 * change.
 */
export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p className="leading-relaxed">
        {SITE_NAME} ({SITE_URL}) is a free, fan-made tool run by {OPERATOR} as a hobby project. It
        has no user accounts, sets no cookies, runs no analytics or advertising, and keeps no
        database. This page explains the small amount of data that still moves when you use it, and
        your rights over it under the General Data Protection Regulation (GDPR) and similar laws.
      </p>

      <Section title="1. Who is responsible">
        <p>
          The data controller for this site is {OPERATOR}, reachable via{" "}
          <Ext href={CONTACT_URL}>{CONTACT_LABEL}</Ext>. The site is a non-commercial personal
          project and no data protection officer is appointed.
        </p>
      </Section>

      <Section title="2. What we do not do">
        <ul>
          <li>No accounts, sign-ups, logins or passwords.</li>
          <li>No cookies, tracking pixels, fingerprinting or analytics of any kind.</li>
          <li>No advertising and no advertising networks.</li>
          <li>No server or database of our own that stores anything about you.</li>
          <li>
            No selling, renting or sharing of personal data with anyone for their own purposes.
          </li>
        </ul>
      </Section>

      <Section title="3. Data processed when you load a page">
        <p>
          The site is static files served by Cloudflare Pages, operated by Cloudflare, Inc. Like
          every web server, Cloudflare receives your IP address, browser type and the page requested
          in order to deliver it, and may keep operational logs for security. The site uses no
          analytics on top of that. See the{" "}
          <Ext href="https://www.cloudflare.com/privacypolicy/">Cloudflare Privacy Policy</Ext>.
        </p>
        <p>
          Fonts, scripts and stylesheets are bundled with the site and served from the same origin.
          No third-party font or script service is loaded.
        </p>
        <p>
          Old links to the site's former address, xymoh.github.io/aurum, are answered by GitHub
          Pages (GitHub, Inc.), which receives your IP address and the requested path, and then
          forward you here. See the{" "}
          <Ext href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
            GitHub Privacy Statement
          </Ext>
          .
        </p>
        <p>
          The Ko-fi link opens ko-fi.com, which handles donations under its own privacy policy. If
          you donate, Ko-fi may share details such as your name or username, email address and
          message with us. We use them only to thank or reply to you, and keep them no longer than
          that needs.
        </p>
      </Section>

      <Section title="4. Data processed when you look up a UID">
        <p>
          When you enter a game UID, your browser sends that UID to a small relay we operate on
          Cloudflare Workers (Cloudflare, Inc.). The relay exists only because Enka.Network cannot
          be called from a browser directly. It forwards the UID to{" "}
          <Ext href="https://enka.network/">Enka.Network</Ext>, returns the public showcase data,
          and keeps no log of its own. To stop abuse, it counts requests per IP address in the
          Worker's memory and turns away more than 30 a minute; that count is never written anywhere
          and disappears when Cloudflare restarts the Worker. Cloudflare sees your IP address as
          part of delivering the request, and a successful Enka answer is cached on its edge network
          and in your browser for one minute. Enka.Network receives the UID from the relay, not your
          IP address. See the{" "}
          <Ext href="https://www.cloudflare.com/privacypolicy/">Cloudflare Privacy Policy</Ext>.
        </p>
        <p>
          When a showcase link is shared, the app that shows its preview (Discord, X and the like)
          requests the page from us, and a Cloudflare Pages Function fetches that UID's public
          showcase from Enka.Network the same way, to put the player's nickname, characters and one
          character's artwork in the preview. It keeps no log, and the answer is cached for a few
          minutes.
        </p>
        <p>
          A UID identifies a game account, not a person, but if the account is yours it can be
          personal data. We process it for the sole purpose of fetching the showcase you asked for,
          and we do not record which UIDs are looked up.
        </p>
      </Section>

      <Section title="5. Images loaded from third parties">
        <p>
          Character, weapon and equipment artwork is loaded directly by your browser from
          Enka.Network (enka.network) and, for Honkai: Star Rail, from the StarRailRes repository
          via jsDelivr (cdn.jsdelivr.net, or fastly.jsdelivr.net if a request there fails). The
          Genshin Impact build pages also load material and element icons from Project Amber
          (gi.yatta.moe); the Zenless Zone Zero material icons come from this site itself. Those
          servers receive your IP address and browser type as part of any image request, in the same
          way any website that embeds an image does. So that images load faster, every page also
          opens a connection to enka.network and cdn.jsdelivr.net in advance, so those two can see
          your IP address even on a page that shows none of their images. We do not control their
          logging. See the{" "}
          <Ext href="https://www.jsdelivr.com/terms/privacy-policy">jsDelivr Privacy Policy</Ext>.
        </p>
      </Section>

      <Section title="6. Data stored in your browser">
        <p>The site uses your browser's local storage, not cookies, to keep:</p>
        <ul>
          <li>your theme and language choice, only once you change them;</li>
          <li>the last ten UIDs you looked up in each game, so you can pick them again;</li>
          <li>
            for Genshin Impact, a short summary (the build scores and the date) of each of the last
            20 showcases you opened, so your next visit can show what changed.
          </li>
        </ul>
        <p>
          None of this is sent to us. When you open a character's build page, the site fetches a
          showcase to compare against: the one you opened the page from, or otherwise your most
          recent UID for that game. That sends the UID to our relay and Enka.Network exactly as a
          lookup does; nothing else is ever sent. These items exist only to provide features you
          use, which is why the site shows no consent banner. They stay until you clear them: remove
          a single UID, or clear the list (on Genshin Impact, with its summaries), from the recent
          lookups on each game's home page, or clear site data for this site in your browser.
        </p>
      </Section>

      <Section title="7. Share cards">
        <p>
          The character card is drawn entirely in your browser. Saving it writes a file to your
          device and nothing is uploaded. Choosing X, Instagram, Discord or your phone's share sheet
          hands the image, or a link to this page, to that app or service under its own privacy
          policy; no copy passes through us.
        </p>
      </Section>

      <Section title="8. Data about other players">
        <p>
          The showcase data shown for a UID (nickname, signature, level, and the characters and gear
          a player has chosen to display) is information that player made public inside the game
          through its Character Showcase feature, and that Enka.Network publishes. {SITE_NAME}{" "}
          displays it transiently and stores none of it.
        </p>
        <p>
          If you do not want your own showcase to be viewable, disable "Show Character Details" in
          the game's settings, which removes the data at the source. Requests about data held by
          Enka.Network should go to Enka.Network directly.
        </p>
      </Section>

      <Section title="9. Legal basis and retention">
        <p>
          Keeping the items in section 6 on your device is strictly necessary for features you use
          (Article 5(3) of the ePrivacy Directive). The rest of the processing described above is
          carried out on the basis of our legitimate interest (Article 6(1)(f) GDPR) in operating
          the tool you chose to use, which requires delivering the page, fetching the showcase you
          requested and protecting the relay from abuse. We keep no data on a server, so there is no
          retention period on our side. Our hosting and relay providers keep their own operational
          logs for the periods stated in their policies linked above.
        </p>
        <p>
          The recipients are Cloudflare (hosting and the relay), Enka.Network, the image hosts in
          section 5 (jsDelivr and the networks it uses, and Project Amber), GitHub (old links only)
          and Ko-fi (only if you use it).
        </p>
      </Section>

      <Section title="10. International transfers">
        <p>
          Cloudflare and GitHub are based in the United States and may process data outside the
          European Economic Area. Both participate in the EU-US Data Privacy Framework, which is the
          safeguard the GDPR requires for such transfers. The image hosts in section 5 may also
          process data outside the EEA under their own policies.
        </p>
      </Section>

      <Section title="11. Your rights">
        <p>
          Under the GDPR you have the right to access, correct, delete or restrict personal data
          about you, to object to its processing, to data portability, and to complain to a data
          protection supervisory authority, in particular in the EU or EEA country where you live or
          work or where you think the breach took place. Because we hold no data about you, most of
          these requests can only be answered by confirming that fact, but you are welcome to ask
          via <Ext href={CONTACT_URL}>{CONTACT_LABEL}</Ext>. Visitors outside the EU have comparable
          rights under their local laws and may exercise them the same way.
        </p>
      </Section>

      <Section title="12. Children">
        <p>
          The site is not directed at children under 16 and knowingly collects no data from anyone
          of any age.
        </p>
      </Section>

      <Section title="13. Changes">
        <p>
          If the way the site handles data changes, this page changes with it and the effective date
          at the top is updated. Use of the site is also subject to the{" "}
          <Link to={TERMS_PATH} className="text-accent underline hover:opacity-80">
            Terms of Use
          </Link>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}

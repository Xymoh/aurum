import { Link } from "react-router-dom";
import { Ext, LegalLayout, Section } from "./LegalLayout";
import { CONTACT_LABEL, CONTACT_URL, OPERATOR, SITE_NAME, SITE_URL, TERMS_PATH } from "./site";

/**
 * What the site does with data, in plain language.
 *
 * Every claim here must stay true of the code: the site sets no cookies,
 * runs no analytics, keeps no server of its own, and sends a lookup only to
 * the operator's Cloudflare Worker and from there to Enka.Network. Anyone
 * adding a tracker, a new CDN or a new proxy must update this page in the
 * same change.
 */
export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p className="leading-relaxed">
        {SITE_NAME} ({SITE_URL}) is a free, fan-made tool run by {OPERATOR} as a hobby project. It has no
        user accounts, sets no cookies, runs no analytics or advertising, and keeps no database. This
        page explains the small amount of data that still moves when you use it, and your rights over
        it under the General Data Protection Regulation (GDPR) and similar laws.
      </p>

      <Section title="1. Who is responsible">
        <p>
          The data controller for this site is {OPERATOR}, reachable via{" "}
          <Ext href={CONTACT_URL}>{CONTACT_LABEL}</Ext>. The site is a non-commercial personal project
          and no data protection officer is appointed.
        </p>
      </Section>

      <Section title="2. What we do not do">
        <ul>
          <li>No accounts, sign-ups, logins or passwords.</li>
          <li>No cookies, tracking pixels, fingerprinting or analytics of any kind.</li>
          <li>No advertising and no advertising networks.</li>
          <li>No server or database of our own that stores anything about you.</li>
          <li>No selling, renting or sharing of personal data with anyone for their own purposes.</li>
        </ul>
      </Section>

      <Section title="3. Data processed when you load a page">
        <p>
          The site is static files served by GitHub Pages, operated by GitHub, Inc. Like every web
          server, GitHub receives your IP address, browser type and the page requested in order to
          deliver it, and may keep server logs for security. We have no access to those logs. See the{" "}
          <Ext href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
            GitHub General Privacy Statement
          </Ext>
          .
        </p>
        <p>
          Fonts, scripts and stylesheets are bundled with the site and served from the same origin. No
          third-party font or script service is loaded.
        </p>
      </Section>

      <Section title="4. Data processed when you look up a UID">
        <p>
          When you enter a game UID, your browser sends that UID to a small relay we operate on
          Cloudflare Workers (Cloudflare, Inc.). The relay exists only because Enka.Network cannot be
          called from a browser directly. It forwards the UID to{" "}
          <Ext href="https://enka.network/">Enka.Network</Ext>, returns the public showcase data, and
          keeps no log of its own. Cloudflare sees your IP address as part of delivering the request
          and may cache the Enka response for a few minutes on its edge network. Enka.Network receives
          the UID from the relay, not your IP address. See the{" "}
          <Ext href="https://www.cloudflare.com/privacypolicy/">Cloudflare Privacy Policy</Ext>.
        </p>
        <p>
          A UID identifies a game account, not a person, but if the account is yours it can be personal
          data. We process it for the sole purpose of fetching the showcase you asked for, and we do not
          record which UIDs are looked up.
        </p>
      </Section>

      <Section title="5. Images loaded from third parties">
        <p>
          Character, weapon and equipment artwork is loaded directly by your browser from Enka.Network
          (enka.network) and, for Honkai: Star Rail, from the StarRailRes repository via jsDelivr
          (cdn.jsdelivr.net). Those servers receive your IP address and browser type as part of any
          image request, in the same way any website that embeds an image does. We do not control
          their logging. See the{" "}
          <Ext href="https://www.jsdelivr.com/terms/privacy-policy">jsDelivr Privacy Policy</Ext>.
        </p>
      </Section>

      <Section title="6. Data stored in your browser">
        <p>
          The site uses your browser's local storage, not cookies, to remember three things: your
          theme choice, your language choice, and the last ten UIDs you looked up in each game so you
          can pick them again. The build pages reuse the most recent of those UIDs to fetch that
          showcase again when you open a character, which sends the UID to our relay and
          Enka.Network exactly as a lookup does; nothing else is ever sent. It exists only to provide
          features you asked for, which is why the site shows no consent banner. You can clear it at any time by clearing site data for this site in your
          browser.
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
          The showcase data shown for a UID (nickname, signature, level, and the characters and gear a
          player has chosen to display) is information that player made public inside the game through
          its Character Showcase feature, and that Enka.Network publishes. {SITE_NAME} displays it
          transiently and stores none of it.
        </p>
        <p>
          If you do not want your own showcase to be viewable, disable "Show Character Details" in the
          game's settings, which removes the data at the source. Requests about data held by
          Enka.Network should go to Enka.Network directly.
        </p>
      </Section>

      <Section title="9. Legal basis and retention">
        <p>
          The processing described above is carried out on the basis of our legitimate interest
          (Article 6(1)(f) GDPR) in operating the tool you chose to use, which requires delivering the
          page and fetching the showcase you requested. We keep no data, so there is no retention period
          on our side. Our hosting and relay providers keep their own operational logs for the periods
          stated in their policies linked above.
        </p>
      </Section>

      <Section title="10. International transfers">
        <p>
          GitHub and Cloudflare are based in the United States and may process data outside the
          European Economic Area. Both participate in the EU-US Data Privacy Framework and offer EU
          standard contractual clauses, which are the safeguards the GDPR requires for such transfers.
        </p>
      </Section>

      <Section title="11. Your rights">
        <p>
          Under the GDPR you have the right to access, correct, delete or restrict personal data about
          you, to object to its processing, to data portability, and to complain to a supervisory
          authority in your country. Because we hold no data about you, most of these requests can only
          be answered by confirming that fact, but you are welcome to ask via{" "}
          <Ext href={CONTACT_URL}>{CONTACT_LABEL}</Ext>. Visitors outside the EU have comparable rights
          under their local laws and may exercise them the same way.
        </p>
      </Section>

      <Section title="12. Children">
        <p>
          The site is not directed at children under 16 and knowingly collects no data from anyone of
          any age.
        </p>
      </Section>

      <Section title="13. Changes">
        <p>
          If the way the site handles data changes, this page changes with it and the effective date at
          the top is updated. Use of the site is also subject to the{" "}
          <Link to={TERMS_PATH} className="text-accent underline hover:opacity-80">
            Terms of Use
          </Link>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}

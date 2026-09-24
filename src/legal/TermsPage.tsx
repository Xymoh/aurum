import { Link } from "react-router-dom";
import { Ext, LegalLayout, Section } from "./LegalLayout";
import {
  CONTACT_LABEL,
  CONTACT_URL,
  LICENSE_URL,
  NOTICES_URL,
  OPERATOR,
  PRIVACY_PATH,
  REPO_URL,
  SITE_NAME,
  SITE_URL,
} from "./site";

/**
 * Terms for a free fan tool: what it is, whose work it builds on, and that
 * its scores are opinions offered as-is. The intellectual property section is
 * the one that matters most; every game asset on the site belongs to
 * HoYoverse and is used under their fan content rules.
 */
export function TermsPage() {
  return (
    <LegalLayout title="Terms of Use">
      <p className="leading-relaxed">
        {SITE_NAME} ({SITE_URL}) is a free, fan-made gear scoring tool for Genshin Impact, Honkai: Star
        Rail and Zenless Zone Zero, run by {OPERATOR}. By using the site you agree to these terms. If
        you do not agree, please do not use it.
      </p>

      <Section title="1. What the site is">
        <p>
          The site reads a player's public in-game showcase and rates the artifacts, relics or drive
          discs on display. It is provided free of charge, for personal and non-commercial use, as an
          informational tool. It is not a product or service of HoYoverse and requires no account.
        </p>
      </Section>

      <Section title="2. Not affiliated with HoYoverse">
        <p>
          {SITE_NAME} is an independent fan project. It is not affiliated with, endorsed by, sponsored
          by or otherwise connected to HoYoverse, COGNOSPHERE PTE. LTD., miHoYo or any of their
          affiliates.
        </p>
        <p>
          Genshin Impact, Honkai: Star Rail, Zenless Zone Zero, and all related names, characters,
          artwork, icons and other game assets are trademarks and copyright of COGNOSPHERE PTE. LTD.
          and miHoYo Co., Ltd. They appear on this site for the purpose of identifying and describing
          in-game items, in a non-commercial fan work, in accordance with HoYoverse's fan-created
          content guidelines. No ownership of those assets is claimed.
        </p>
        <p>
          If you are a rights holder and believe any material on this site infringes your rights,
          contact us via <Ext href={CONTACT_URL}>{CONTACT_LABEL}</Ext> and it will be reviewed and, if
          appropriate, removed promptly.
        </p>
      </Section>

      <Section title="3. Third-party data and credits">
        <p>The site builds on the work of others, used with thanks and in line with their terms:</p>
        <ul>
          <li>
            <Ext href="https://enka.network/">Enka.Network</Ext> provides the showcase data and the
            character, weapon and artifact artwork.
          </li>
          <li>
            <Ext href="https://github.com/frzyc/genshin-optimizer">Genshin Optimizer</Ext> provides
            Genshin Impact character stat data.
          </li>
          <li>
            <Ext href="https://github.com/fribbels/hsr-optimizer">Fribbels HSR Optimizer</Ext> provides
            the scoring methodology and Honkai: Star Rail character weights.
          </li>
          <li>
            <Ext href="https://github.com/Mar-7th/StarRailRes">StarRailRes</Ext> provides Honkai: Star
            Rail artwork.
          </li>
          <li>
            <Ext href="https://game8.co/">Game8</Ext>, <Ext href="https://www.prydwen.gg/">Prydwen</Ext>{" "}
            and <Ext href="https://genshin.gg/">genshin.gg</Ext> inform the build and set recommendations.
          </li>
          <li>
            <Ext href="https://gi.yatta.moe/">Project Amber</Ext> and community mirrors of the games'
            data files supply localised names and item ids.
          </li>
          <li>
            <Ext href="https://zzz.nanoka.cc/">nanoka.cc</Ext> supplies the Zenless Zone Zero material
            icons.
          </li>
        </ul>
        <p>
          The full list, with each source's licence and the notices those licences require, is kept
          in the repository as <Ext href={NOTICES_URL}>THIRD_PARTY_NOTICES.md</Ext>.
        </p>
        <p>
          Those sites and services are independent of {SITE_NAME}, have their own terms, and are not
          responsible for anything here. Links to them are provided for convenience and attribution.
        </p>
      </Section>

      <Section title="4. Scores are opinions">
        <p>
          A score is the output of a formula that weighs each stat by how useful it is generally
          considered to be for a given character. It is a quick evaluation, not a definitive build
          guide. It does not account for your team, weapon, constellations, rotation or playstyle,
          and it may be wrong for your situation. Decisions about what to level, reroll, farm or spend
          in-game currency on are yours alone. We accept no responsibility for in-game resources spent
          on the strength of a score.
        </p>
      </Section>

      <Section title="5. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>Use the site to harass, stalk or target any player, or to build profiles of players.</li>
          <li>
            Send automated or bulk requests to the site or its relay, scrape it, or otherwise place an
            unreasonable load on it or on Enka.Network.
          </li>
          <li>Attempt to interfere with, circumvent or reverse-engineer the relay.</li>
          <li>Present the site or its output as endorsed by HoYoverse.</li>
          <li>Use the site in any way that breaks applicable law.</li>
        </ul>
        <p>
          You may only look up showcases that players have chosen to make public in the game. What a
          player displays there is their decision, and they can withdraw it at any time by changing
          their in-game settings.
        </p>
      </Section>

      <Section title="6. Availability and changes">
        <p>
          The site is a hobby project. It may be changed, interrupted, rate-limited or shut down at any
          time without notice, and it depends on third-party services that may do the same. There is no
          guarantee of availability, accuracy or continued support.
        </p>
      </Section>

      <Section title="7. No warranty and limitation of liability">
        <p>
          The site is provided "as is" and "as available", without warranty of any kind, express or
          implied, including fitness for a particular purpose, accuracy or non-infringement. To the
          fullest extent permitted by law, {OPERATOR} is not liable for any loss or damage arising from
          use of, or inability to use, the site or anything it displays.
        </p>
        <p>
          Nothing in these terms excludes or limits liability that cannot be excluded by law, including
          liability for intent, gross negligence, or death or personal injury caused by negligence. If
          you are a consumer, the mandatory consumer protection rules of the country you live in still
          apply, and nothing here takes those rights away.
        </p>
      </Section>

      <Section title="8. The site's own code">
        <p>
          The scoring code and this site's own text and design belong to {OPERATOR}. The source is
          published at <Ext href={REPO_URL}>{REPO_URL}</Ext> under the{" "}
          <Ext href={LICENSE_URL}>MIT License</Ext>, which governs its reuse. Game assets and
          third-party data are not covered by that licence and remain under their owners' rights as
          described above.
        </p>
      </Section>

      <Section title="9. Privacy">
        <p>
          How the site handles data is described in the{" "}
          <Link to={PRIVACY_PATH} className="text-accent underline hover:opacity-80">
            Privacy Policy
          </Link>
          , which forms part of these terms.
        </p>
      </Section>

      <Section title="10. Changes to these terms">
        <p>
          These terms may be updated from time to time. The effective date at the top shows the current
          version. Continued use of the site after a change means you accept the updated terms.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions, complaints and takedown requests: <Ext href={CONTACT_URL}>{CONTACT_LABEL}</Ext>.
        </p>
      </Section>
    </LegalLayout>
  );
}

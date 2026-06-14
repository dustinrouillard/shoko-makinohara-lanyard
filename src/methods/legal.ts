import { CraftedResponse, ParsedRequest } from '../types/Routes';

const STYLE = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    background: #0d0f12;
    color: #e6e8eb;
    line-height: 1.6;
  }
  main {
    max-width: 760px;
    margin: 0 auto;
    padding: 64px 24px 96px;
  }
  header {
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 1px solid #1f2329;
  }
  header h1 {
    margin: 0 0 8px;
    font-size: 28px;
    font-weight: 600;
  }
  header p {
    margin: 0;
    color: #8b9098;
    font-size: 14px;
  }
  header .updated {
    margin-top: 8px;
    color: #6c7178;
    font-size: 13px;
  }
  h2 {
    margin: 32px 0 12px;
    font-size: 18px;
    font-weight: 600;
    color: #f4f6f8;
  }
  p, li { color: #c4c8cd; font-size: 15px; }
  ul { padding-left: 20px; }
  a { color: #7aa7ff; text-decoration: none; }
  a:hover { text-decoration: underline; }
  footer {
    margin-top: 48px;
    padding-top: 16px;
    border-top: 1px solid #1f2329;
    color: #6c7178;
    font-size: 13px;
  }
  footer .group { display: block; margin-bottom: 6px; }
  footer .group:last-child { margin-bottom: 0; }
  footer .label { color: #6c7178; margin-right: 6px; }
`;

type PageOptions = {
  title: string;
  subtitle: string;
  documentTitle: string;
  activePath: string;
  lastUpdated: string;
  body: string;
};

const LAST_UPDATED = '2026-06-11';

function footer(activePath: string): string {
  const link = (href: string, label: string) =>
    href === activePath ? `<strong>${label}</strong>` : `<a href="${href}">${label}</a>`;
  return `
    <footer>
      <span class="group">
        <span class="label">Shoko Makinohara bot:</span>
        ${link('/terms', 'Terms')} &middot; ${link('/privacy', 'Privacy')}
      </span>
      <span class="group">
        <span class="label">Lanyard service:</span>
        ${link('/lanyard/terms', 'Terms')} &middot; ${link('/lanyard/privacy', 'Privacy')}
      </span>
    </footer>
  `;
}

function page(opts: PageOptions): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${opts.documentTitle}</title>
  <style>${STYLE}</style>
</head>
<body>
  <main>
    <header>
      <h1>${opts.title}</h1>
      <p>${opts.subtitle}</p>
      <p class="updated">Last updated: ${opts.lastUpdated}</p>
    </header>
    ${opts.body}
    ${footer(opts.activePath)}
  </main>
</body>
</html>`;
}

const SHOKO_SUBTITLE = 'Shoko Makinohara &mdash; utility &amp; moderation bot for the Lanyard Discord server';
const LANYARD_SUBTITLE = 'Lanyard &mdash; public presence &amp; profile API for members of the Lanyard Discord server';

const SHOKO_TERMS_BODY = `
  <p>
    These terms cover your use of <strong>Shoko Makinohara</strong>, a Discord
    bot that operates solely within the <strong>Lanyard Discord server</strong>.
    Shoko Makinohara provides slash commands, informational lookups, and
    automated moderation for the Lanyard server. It is not installed in, and
    does not operate in, any other Discord server.
  </p>

  <p>
    This document covers the bot itself. The separate Lanyard presence/profile
    API (which exposes activity and KV data) has its own
    <a href="/lanyard/terms">Terms</a> and <a href="/lanyard/privacy">Privacy Policy</a>.
  </p>

  <h2>Scope</h2>
  <p>
    Shoko Makinohara only reads data from inside the Lanyard Discord server.
    It does not read message content, presence, or activity from any other
    server, and it does not message users in DMs. If you are not a member of
    the Lanyard server, the bot collects nothing about you.
  </p>

  <h2>What the bot does</h2>
  <ul>
    <li>Responds to slash commands and context menu interactions issued in the Lanyard server (status lookups, stats, project listings, moderator tools, etc.).</li>
    <li>Performs automated moderation on messages sent in the Lanyard server (scam-image perceptual hash matching and cross-channel duplicate detection).</li>
    <li>Persists moderator-issued mute state so the muted role is re-applied if a muted user leaves and rejoins the server.</li>
    <li>Maintains an in-memory cache of which members are currently displaying the Lanyard server's tag (clan tag), used by the public <code>/tag</code> command to show a count.</li>
    <li>Posts moderation audit events to a private staff channel.</li>
  </ul>

  <h2>Using the service</h2>
  <p>
    By joining the Lanyard Discord server, you agree to follow the server
    rules and Discord's own
    <a href="https://discord.com/terms">Terms of Service</a> and
    <a href="https://discord.com/guidelines">Community Guidelines</a>.
    Shoko Makinohara is provided as-is, with no guarantee of uptime or
    availability.
  </p>

  <h2>Automated moderation</h2>
  <p>
    To keep the Lanyard server safe from scams and spam, messages sent
    <em>in the Lanyard server</em> are processed in real time by
    automated moderation. This includes matching attached images
    against a database of known scam-image perceptual hashes (pHash)
    and detecting cross-channel duplicate posts (the same message
    reposted in multiple channels within a short window).
  </p>
  <p>
    When a hit is found, the offending user is removed from the server
    with their recent messages deleted &mdash; a &ldquo;soft-ban&rdquo;
    (a ban issued to wipe recent messages, immediately followed by an
    unban so the user is not permanently barred). All automod actions
    are logged to a private moderator channel for review.
  </p>
  <p>
    When automod fires on a message whose attachments do not match an
    existing scam-image hash, those attachments may be re-shared into a
    private moderator channel so staff can review them and, if
    appropriate, add their perceptual hash to the scam database. No
    content beyond the attachments themselves is captured.
  </p>
  <p>
    Messages sent in other Discord servers are never seen by Shoko
    Makinohara.
  </p>

  <h2>Acceptable use</h2>
  <ul>
    <li>Do not abuse the bot or the Lanyard server (spam, attempts to disrupt service, abuse of commands).</li>
    <li>Do not use the bot to harass other users or distribute illegal content.</li>
    <li>Do not attempt to bypass moderation actions or impersonate staff.</li>
  </ul>

  <h2>Termination</h2>
  <p>
    We may remove you from the Lanyard server or restrict your access to
    the bot at any time, for any reason, particularly for violations of
    these terms or Discord's terms. Leaving the Lanyard server stops
    further data collection by Shoko Makinohara, with one exception:
    if you leave while muted, a record of your mute is kept so the muted
    role can be re-applied if you rejoin (preventing mute bypass by
    leaving and coming back). See the <a href="/privacy">Privacy Policy</a>
    for full retention details.
  </p>

  <h2>Changes</h2>
  <p>
    These terms may be updated from time to time. Continued use of the
    service after changes constitutes acceptance of the updated terms.
  </p>
`;

const SHOKO_PRIVACY_BODY = `
  <p>
    This policy describes what data <strong>Shoko Makinohara</strong> &mdash;
    the utility and moderation bot operating inside the
    <strong>Lanyard Discord server</strong> &mdash; processes, why, and how
    long it is kept. Shoko Makinohara is not present in any other Discord
    server, so nothing in this policy applies to data outside of the
    Lanyard server.
  </p>

  <p>
    The separate Lanyard presence/profile API (which exposes activity and
    KV data) has its own <a href="/lanyard/privacy">Privacy Policy</a>.
  </p>

  <h2>Scope of collection</h2>
  <p>
    All data processed by Shoko Makinohara is collected exclusively from
    within the Lanyard Discord server. The bot does not read messages or
    interactions from any other server you are in, and it does not collect
    data from users who are not members of the Lanyard server.
  </p>

  <h2>What we process</h2>
  <ul>
    <li>
      <strong>Message content</strong> &mdash; messages you send
      <em>inside the Lanyard Discord server</em> are processed in real time
      for automated moderation (scam-image perceptual hash matching and
      cross-channel duplicate detection) and to handle bot commands
      directed at Shoko Makinohara. Messages are not stored long-term
      except where referenced by a moderation audit entry. Messages from
      other Discord servers are never seen.
    </li>
    <li>
      <strong>Attachments from automod hits</strong> &mdash; when automod
      acts on a message whose attached images do not match an existing
      scam-image hash, those attachments may be re-uploaded to a private
      moderator channel for staff review and possible addition to the
      scam-image hash database. Only the attachment files themselves are
      captured.
    </li>
    <li>
      <strong>Interaction metadata</strong> &mdash; when you invoke a slash
      command or context menu action in the Lanyard server, Discord provides
      your user ID and the command parameters so the bot can respond. This
      is not stored beyond what's needed to handle the interaction, aside
      from aggregate usage counters described below.
    </li>
    <li>
      <strong>Mute state</strong> &mdash; when a moderator applies the
      muted (or support-muted) role to your account, a record is kept
      keyed on your Discord user ID so the role can be re-applied if you
      leave the server and rejoin. The record is cleared as soon as a
      moderator removes the role.
    </li>
    <li>
      <strong>Server-tag display</strong> &mdash; the bot keeps an
      in-memory list of which members are currently displaying the
      Lanyard server's tag (clan tag) so the public <code>/tag</code>
      command can report a count. The list is rebuilt from Discord on
      restart and updated live from member events; entries are removed
      when you stop displaying the tag or leave the server.
    </li>
    <li>
      <strong>Moderation audit log</strong> &mdash; actions taken by automod
      or by moderators using the bot's tooling (deletes, mutes, kicks,
      soft-bans, reports) are recorded in a private staff channel for
      moderation history.
    </li>
    <li>
      <strong>Operational metrics</strong> &mdash; aggregate, non-identifying
      counters (command usage totals, guild counts) are kept for service
      health monitoring.
    </li>
  </ul>

  <h2>How it's used</h2>
  <ul>
    <li>Running automated moderation inside the Lanyard Discord server.</li>
    <li>Responding to slash commands and context menu interactions issued in the Lanyard server.</li>
    <li>Monitoring service health.</li>
  </ul>

  <h2>Sharing</h2>
  <p>
    Shoko Makinohara does not sell data and does not share it with third
    parties beyond what is required to run the service (Discord, Cloudflare).
    Moderation audit entries are only visible to Lanyard server staff.
  </p>

  <h2>Retention &amp; deletion</h2>
  <p>
    Message content is processed in memory and not retained, except where
    referenced by a moderation audit entry. Attachments re-uploaded to
    the moderator review channel are retained at staff discretion as
    part of the scam-sample collection. Moderation audit entries may be
    retained for the Lanyard server's moderation history. Operational
    metrics are aggregate and do not identify individual users.
  </p>
  <p>
    Leaving the Lanyard server stops further data collection by the bot.
    Mute state is the one intentional exception: if you leave while
    muted, the record persists so the muted role can be re-applied on
    rejoin, and is cleared once a moderator removes the mute. The
    server-tag cache entry for your account is removed as soon as you
    leave or stop displaying the tag.
  </p>

  <h2>Your choices</h2>
  <ul>
    <li>Leave the Lanyard Discord server to stop all data collection by Shoko Makinohara.</li>
    <li>Stop invoking the bot's commands to avoid contributing to interaction processing or usage counters.</li>
  </ul>

  <h2>Contact</h2>
  <p>
    Questions about this policy can be raised in the Lanyard Discord server.
  </p>
`;

const LANYARD_TERMS_BODY = `
  <p>
    These terms cover your use of the <strong>Lanyard</strong> service &mdash;
    the public API and WebSocket at
    <a href="https://api.lanyard.rest">api.lanyard.rest</a> that exposes
    Discord presence, activity, and user-set key/value data for members of
    the <strong>Lanyard Discord server</strong>.
  </p>

  <p>
    The Shoko Makinohara bot (utility and moderation) has its own
    <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
  </p>

  <h2>Scope</h2>
  <p>
    The Lanyard service only collects presence and activity for users who
    are members of the Lanyard Discord server. Presence and activity from
    any other Discord server you are in is never collected. If you are not
    a member of the Lanyard server, no data about you is collected or
    exposed by the service.
  </p>

  <h2>What the service does</h2>
  <ul>
    <li>Reads your Discord presence (online status, current game, Spotify, custom status, etc.) while you are a member of the Lanyard server.</li>
    <li>Exposes that presence, plus your Discord user ID, username, and avatar, through a public REST API and WebSocket keyed on your Discord user ID.</li>
    <li>Stores and serves user-set key/value (KV) entries that you create through bot commands, as part of the same public API.</li>
  </ul>

  <h2>Public exposure</h2>
  <p>
    The Lanyard API is, by design, publicly readable: anyone who knows
    your Discord user ID can query your presence, activity, and KV data
    through it. That public exposure is the purpose of the service.
    By participating &mdash; that is, by being a member of the Lanyard
    Discord server &mdash; you acknowledge and accept that this data is
    publicly available for the duration of your membership. KV entries
    you create are also public; do not put anything sensitive in them.
  </p>

  <h2>Using the service</h2>
  <p>
    Lanyard is provided as-is, with no guarantee of uptime, availability,
    or accuracy. Your use of the API is also subject to Discord's
    <a href="https://discord.com/terms">Terms of Service</a>.
  </p>

  <h2>Acceptable use</h2>
  <ul>
    <li>Do not abuse the API (excessive request rates, attempts to disrupt service).</li>
    <li>Do not use Lanyard data to harass, dox, or profile other users.</li>
    <li>Do not resell, license, or commercialize Lanyard data.</li>
    <li>Do not use Lanyard data to train machine learning or AI models.</li>
  </ul>

  <h2>Termination</h2>
  <p>
    We may restrict your access to the API or KV system at any time, for
    any reason, particularly for violations of these terms. Leaving the
    Lanyard Discord server stops further presence collection and removes
    user-set KV data (see the <a href="/lanyard/privacy">Privacy Policy</a>).
  </p>

  <h2>Changes</h2>
  <p>
    These terms may be updated from time to time. Continued use of the
    service after changes constitutes acceptance of the updated terms.
  </p>
`;

const LANYARD_PRIVACY_BODY = `
  <p>
    This policy describes what data the <strong>Lanyard</strong> service
    &mdash; the public presence and profile API at
    <a href="https://api.lanyard.rest">api.lanyard.rest</a> &mdash; processes
    for members of the <strong>Lanyard Discord server</strong>, why, and
    how long it is kept.
  </p>

  <p>
    The Shoko Makinohara bot (utility and moderation) has its own
    <a href="/privacy">Privacy Policy</a> covering message content for
    automod and slash command interactions.
  </p>

  <h2>Scope of collection</h2>
  <p>
    Lanyard only collects presence and activity data while you are a
    member of the Lanyard Discord server, and only as reported by Discord
    to that server. Presence in other Discord servers you are in is never
    collected. If you are not a member of the Lanyard server, the service
    holds no data about you.
  </p>

  <h2>What we process</h2>
  <ul>
    <li>
      <strong>Profile fields</strong> &mdash; your Discord user ID,
      username, and avatar are read so the API can return them alongside
      your presence.
    </li>
    <li>
      <strong>Presence &amp; activity</strong> &mdash; while you are a
      member of the Lanyard Discord server, your online status and
      activities Discord exposes to that server (current game, Spotify
      track, custom status, etc.) are read so they can be served through
      the public REST API and WebSocket. Presence is only read from the
      Lanyard server &mdash; not from any other server you are in.
    </li>
    <li>
      <strong>User-set KV data</strong> &mdash; key/value entries you set
      yourself through bot commands are stored so the API can serve them
      back. KV entries are public, alongside the rest of your Lanyard
      profile.
    </li>
  </ul>

  <h2>How it's used</h2>
  <ul>
    <li>Powering the public Lanyard REST API and WebSocket.</li>
    <li>Letting you embed your presence on status sites, personal websites, dashboards, and other places of your choosing.</li>
  </ul>

  <h2>Sharing &amp; public exposure</h2>
  <p>
    Presence, activity, profile fields, and KV data exposed via the
    Lanyard API are publicly readable by anyone who knows your Discord
    user ID. That is the purpose of the service. We do not sell data
    and do not share it with third parties beyond what is required to
    run the service (Discord, Cloudflare). Because the API is public,
    we cannot control who consumes it once data has been served.
  </p>

  <h2>Retention &amp; deletion</h2>
  <p>
    Presence and activity data is ephemeral &mdash; it only exists while
    you are a member of the Lanyard server and connected to Discord, and
    is not retained as historical records. User-set KV data persists
    until you remove it or until you leave the Lanyard Discord server,
    at which point all data set by you or provided by you to the service
    is deleted.
  </p>

  <h2>Your choices</h2>
  <ul>
    <li>Leave the Lanyard Discord server to stop presence collection and clear any user-set data tied to your account.</li>
    <li>Adjust your Discord privacy settings to control what presence/activity Discord exposes to servers in the first place.</li>
    <li>Remove KV entries you've set via the bot at any time.</li>
    <li>Avoid putting sensitive information in KV entries, since they are publicly readable.</li>
  </ul>

  <h2>Contact</h2>
  <p>
    Questions about this policy can be raised in the Lanyard Discord server.
  </p>
`;

export async function Terms(_request: ParsedRequest, response: CraftedResponse) {
  return response
    .status(200)
    .header('content-type', 'text/html; charset=utf-8')
    .send(
      page({
        title: 'Terms of Service',
        subtitle: SHOKO_SUBTITLE,
        documentTitle: 'Terms of Service — Shoko Makinohara',
        activePath: '/terms',
        lastUpdated: LAST_UPDATED,
        body: SHOKO_TERMS_BODY,
      }),
    );
}

export async function Privacy(_request: ParsedRequest, response: CraftedResponse) {
  return response
    .status(200)
    .header('content-type', 'text/html; charset=utf-8')
    .send(
      page({
        title: 'Privacy Policy',
        subtitle: SHOKO_SUBTITLE,
        documentTitle: 'Privacy Policy — Shoko Makinohara',
        activePath: '/privacy',
        lastUpdated: LAST_UPDATED,
        body: SHOKO_PRIVACY_BODY,
      }),
    );
}

export async function LanyardTerms(_request: ParsedRequest, response: CraftedResponse) {
  return response
    .status(200)
    .header('content-type', 'text/html; charset=utf-8')
    .send(
      page({
        title: 'Terms of Service',
        subtitle: LANYARD_SUBTITLE,
        documentTitle: 'Terms of Service — Lanyard',
        activePath: '/lanyard/terms',
        lastUpdated: LAST_UPDATED,
        body: LANYARD_TERMS_BODY,
      }),
    );
}

export async function LanyardPrivacy(_request: ParsedRequest, response: CraftedResponse) {
  return response
    .status(200)
    .header('content-type', 'text/html; charset=utf-8')
    .send(
      page({
        title: 'Privacy Policy',
        subtitle: LANYARD_SUBTITLE,
        documentTitle: 'Privacy Policy — Lanyard',
        activePath: '/lanyard/privacy',
        lastUpdated: LAST_UPDATED,
        body: LANYARD_PRIVACY_BODY,
      }),
    );
}

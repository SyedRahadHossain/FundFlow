/**
 * Frontend origin used for Stripe redirect URLs.
 *
 * `CLIENT_URL` reaches users as a redirect target *after* they pay, so a value
 * left at the `.env.example` placeholder (or a docs token) sends them to a host
 * nobody owns and the failure surfaces as a bare 404 after a real charge. Reject
 * those values here so the misconfiguration fails loudly instead.
 */

// Hosts shipped as placeholders in .env.example / docs. Extend when you add one.
const PLACEHOLDER_HOSTS = ['your-client.vercel.app', 'your-app.vercel.app', 'example.com', 'example.org'];
// Reserved TLDs from RFC 2606/6761 — never resolvable in public DNS.
const RESERVED_TLDS = ['.example', '.test', '.invalid'];

/** True when the value is a docs placeholder, non-http, or not a URL at all. */
const isPlaceholderClientUrl = (raw) => {
  if (/[<>]/.test(raw)) return true; // untouched `<your-url>` token from docs
  let url;
  try {
    url = new URL(raw);
  } catch {
    return true;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;
  const host = url.hostname.toLowerCase();
  if (PLACEHOLDER_HOSTS.includes(host)) return true;
  return RESERVED_TLDS.some((tld) => host === tld.slice(1) || host.endsWith(tld));
};

/**
 * Resolve the redirect origin, or null when the configuration is unusable.
 * Outside production an unset value still falls back to the local dev server;
 * a placeholder is always unusable, whatever the environment.
 */
const resolveClientUrl = (env = process.env) => {
  const raw = (env.CLIENT_URL || '').trim().replace(/\/+$/, '');
  if (raw) return isPlaceholderClientUrl(raw) ? null : raw;
  return env.NODE_ENV === 'production' ? null : 'http://localhost:3000';
};

module.exports = { resolveClientUrl, isPlaceholderClientUrl, PLACEHOLDER_HOSTS };

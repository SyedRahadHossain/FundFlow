/**
 * The second way to read.
 *
 * Some networks drop requests whose path contains certain words. The symptom
 * is a page that cannot load its own data while the API is perfectly
 * healthy: no response, no status, the fetch simply fails. When that happens
 * the client asks for the same read again, with the route it wanted in the
 * query string instead of in the path.
 *
 * The read is the same read - the route, the parameters and the caller's
 * token all travel unchanged - so the answer is the answer the original
 * route would have given.
 */

// The reads that have a second way in. Anything else is left alone.
const GATEWAY_ROUTES = ['campaigns', 'campaigns/listing'];

/**
 * The gateway URL for a read, or null when the request is not one of them.
 *
 *   '/api/campaigns/listing?category=Music'
 *     -> '/api/read?route=campaigns%2Flisting&category=Music'
 */
export function readGatewayUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('/api/')) return null;

  const [path, search = ''] = url.split('?');
  const route = path.slice('/api/'.length);
  if (!GATEWAY_ROUTES.includes(route)) return null;

  const params = new URLSearchParams(search);
  params.delete('route');
  const query = params.toString();

  return `/api/read?route=${encodeURIComponent(route)}${query ? `&${query}` : ''}`;
}

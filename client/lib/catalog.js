/**
 * Server-side reads for the public surfaces.
 *
 * The catalog and the platform counters used to be fetched from the browser
 * after the page had already painted, so the first screen was a skeleton and
 * crawlers saw no campaigns at all. These helpers run on the server, are
 * cached for a minute, and hand their data to the page as props.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const REVALIDATE_SECONDS = 60;

async function getJson(path) {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // The API being down must not take the page down with it: the caller
    // falls back to its own error state.
    return null;
  }
}

/** The public catalog: approved campaigns that have not reached their deadline. */
export async function getApprovedCampaigns() {
  const data = await getJson('/api/campaigns?status=approved&active=true');
  if (!Array.isArray(data)) return { campaigns: [], failed: true };
  return { campaigns: data, failed: false };
}

/** The landing ranking: the top campaigns by credits raised. */
export async function getTopFundedCampaigns() {
  const data = await getJson('/api/campaigns/top-funded');
  if (!Array.isArray(data)) return { campaigns: [], failed: true };
  return { campaigns: data, failed: false };
}

/** The live platform counters. A fresh install legitimately reports zeros. */
export async function getPlatformStats() {
  const data = await getJson('/api/stats');
  if (!data || typeof data !== 'object') return { stats: null, failed: true };
  return { stats: data, failed: false };
}

/**
 * The campaign index, read through the search endpoint: the rows for the
 * first page, the size of the whole filtered set, and the category counts.
 *
 * The page arrives with all three, so the count under the filters is right
 * from the first paint instead of after the browser's own request.
 */
export async function getCampaignSearch(query = '') {
  const search = query ? `?${query}` : '';
  const data = await getJson(`/api/campaigns/listing${search}`);
  if (!data || !Array.isArray(data.campaigns)) {
    return { campaigns: [], total: 0, page: 1, limit: 12, pages: 1, facets: { categories: [] }, failed: true };
  }
  return {
    campaigns: data.campaigns,
    total: typeof data.total === 'number' ? data.total : data.campaigns.length,
    page: data.page ?? 1,
    limit: data.limit ?? 12,
    pages: data.pages ?? 1,
    facets: data.facets ?? { categories: [] },
    failed: false,
  };
}

import CampaignsBrowser from '@/components/CampaignsBrowser';
import { getCampaignSearch } from '@/lib/catalog';
import { fromQuery, toQuery } from '@/lib/campaignFilters';

/**
 * The public campaign index.
 *
 * The first page of results is read on the server and rendered into the
 * HTML, so the page arrives with its campaigns instead of a skeleton and a
 * request, and a crawler sees them. The filters then run on the server too:
 * the browser asks the API for the rows that match.
 *
 * A link may arrive with filters in it — /campaigns?category=Education — so the
 * filters are read here, on the server, and handed down with the results.
 * The browser never has to read the URL after the fact, which is what keeps
 * the first paint and the first request in agreement.
 */
export default async function PublicCampaignsPage({ searchParams }) {
  const params = searchParams ? await searchParams : {};
  const filters = fromQuery(params);
  const results = await getCampaignSearch(toQuery(filters));

  return <CampaignsBrowser initialResults={results} initialFilters={filters} />;
}

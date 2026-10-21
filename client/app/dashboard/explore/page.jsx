import ExploreCampaignsClient from './ExploreCampaignsClient';
import { getApprovedCampaigns } from '@/lib/catalog';

/**
 * The supporter's own explore screen.
 *
 * The list is read on the server and handed to the client, the same way the
 * public index does it. That matters more than it looks: a browser that
 * cannot reach the API still gets a page with campaigns on it, because the
 * rows arrived with the page rather than with a request.
 */
export default async function ExploreCampaignsPage() {
  const { campaigns, failed } = await getApprovedCampaigns();
  return (
    <ExploreCampaignsClient
      initialResults={{
        campaigns,
        total: campaigns.length,
        page: 1,
        limit: 12,
        pages: Math.max(1, Math.ceil(campaigns.length / 12)),
        facets: { categories: [] },
        failed,
      }}
    />
  );
}

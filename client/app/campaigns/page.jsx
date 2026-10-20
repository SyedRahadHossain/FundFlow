import CampaignsBrowser from '@/components/CampaignsBrowser';
import { getApprovedCampaigns } from '@/lib/catalog';

/**
 * The public campaign index.
 *
 * The list is read on the server and rendered into the HTML, so the page
 * arrives with its campaigns instead of a skeleton and a request, and a
 * crawler sees them. The filters stay in the browser over that list.
 */
export default async function PublicCampaignsPage() {
  const { campaigns, failed } = await getApprovedCampaigns();
  return <CampaignsBrowser initialCampaigns={campaigns} initialFailed={failed} />;
}

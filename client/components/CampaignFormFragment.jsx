import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

/**
 * The campaign form, as a fragment.
 *
 * The creator's real fields — title, goal in credits, minimum contribution —
 * taken from the form a creator actually fills in, shown as a still fragment
 * of the product (root marked `data-ui`). The action is a real link to the
 * real destination, so nothing on the page pretends to be a form that works
 * here.
 */
export default function CampaignFormFragment() {
  return (
    <div data-ui className="bg-surface rounded-2xl border border-neutral-200 p-6">
      <p className="text-sm text-neutral-500">The form a creator fills in</p>
      <h3 className="mt-1 text-lg font-semibold text-neutral-900">
        Submit a campaign for review
      </h3>

      <div className="mt-5 space-y-4">
        <Input
          label="Campaign Title"
          placeholder="Give your campaign a compelling title"
          disabled
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Funding Goal (credits)" type="number" placeholder="e.g. 1000" disabled />
          <Input label="Min Contribution (credits)" type="number" placeholder="e.g. 10" disabled />
        </div>
      </div>

      <Button asChild variant="primary" width="full" className="mt-5">
        <Link href="/register">Start your campaign</Link>
      </Button>

      <p className="mt-3 text-[13px] text-neutral-500">
        An admin reviews every campaign before it goes live.
      </p>
    </div>
  );
}

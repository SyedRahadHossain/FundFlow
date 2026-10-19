'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CampaignDetail from '@/components/CampaignDetail';

export default function PublicCampaignDetailPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 bg-neutral-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CampaignDetail mode="public" />
        </div>
      </main>
      <Footer />
    </div>
  );
}

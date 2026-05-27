import { MarketplaceListingFoundation } from '@/modules/marketplace/components/marketplace-listing-foundation';

export default function MarketplaceShellPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Marketplace</h2>
        <p className="text-sm text-muted-foreground">
          Crew-facing job discovery — <code className="text-xs">GET /api/v1/marketplace/jobs</code>
        </p>
      </div>
      <MarketplaceListingFoundation />
    </section>
  );
}

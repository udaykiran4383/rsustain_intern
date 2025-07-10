import { MarketplaceHeader } from "@/components/marketplace/marketplace-header"
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters"
import { ProjectGrid } from "@/components/marketplace/project-grid"
import { ProjectMap } from "@/components/marketplace/project-map"
import { Navigation } from "@/components/navigation"

export default function MarketplacePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 px-4">
        <div className="container mx-auto">
          <MarketplaceHeader />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <MarketplaceFilters />
            </div>
            <div className="lg:col-span-3">
              <div className="space-y-6">
                <ProjectMap />
                <ProjectGrid />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

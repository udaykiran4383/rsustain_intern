import { Navigation } from "@/components/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { RiskAssessment } from "@/components/dashboard/risk-assessment"

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 px-4">
        <div className="container mx-auto">
          <DashboardHeader />
          <DashboardStats />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2">
              <PortfolioOverview />
            </div>
            <div>
              <RiskAssessment />
            </div>
          </div>
          <div className="mt-8">
            <RecentTransactions />
          </div>
        </div>
      </div>
    </div>
  )
}

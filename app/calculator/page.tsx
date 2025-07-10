import { Navigation } from "@/components/navigation"
import { CarbonCalculator } from "@/components/calculator/carbon-calculator"

export default function CalculatorPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20 px-4">
        <div className="container mx-auto">
          <CarbonCalculator />
        </div>
      </div>
    </div>
  )
}

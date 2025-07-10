import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, ShoppingCart, Shield, FileText, TrendingUp, Users, Award, Globe } from "lucide-react"

const features = [
  {
    icon: Calculator,
    title: "Carbon Footprint Calculator",
    description: "Calculate Scope 1, 2, and 3 emissions with blockchain verification and gamified sustainability rewards",
    color: "text-green-400",
    bgColor: "from-green-500/20 to-emerald-500/20",
    category: "Analytics"
  },
  {
    icon: ShoppingCart,
    title: "Marketplace Trading",
    description: "Browse verified projects with advanced filtering by type, region, SDG alignment, and certification standards",
    color: "text-blue-400",
    bgColor: "from-blue-500/20 to-cyan-500/20",
    category: "Trading"
  },
  {
    icon: Shield,
    title: "Risk Assessment",
    description: "Advanced AI-powered risk scoring with greenwashing detection and comprehensive project validation",
    color: "text-purple-400",
    bgColor: "from-purple-500/20 to-pink-500/20",
    category: "Security"
  },
  {
    icon: FileText,
    title: "Project Verification",
    description: "Streamlined onboarding with OCR document processing and AI-powered compliance verification",
    color: "text-orange-400",
    bgColor: "from-orange-500/20 to-yellow-500/20",
    category: "Verification"
  },
  {
    icon: TrendingUp,
    title: "Portfolio Management",
    description: "Track investments, manage credits, and generate official retirement certificates with NFT authentication",
    color: "text-pink-400",
    bgColor: "from-pink-500/20 to-rose-500/20",
    category: "Management"
  },
  {
    icon: Users,
    title: "Peer Benchmarking",
    description: "ESG ratings, corporate sustainability reporting, and industry peer comparisons",
    color: "text-cyan-400",
    bgColor: "from-cyan-500/20 to-teal-500/20",
    category: "Analytics"
  },
  {
    icon: Award,
    title: "Sustainability Rewards",
    description: "Earn badges, sustainability points, and unlock exclusive features through environmental achievements",
    color: "text-yellow-400",
    bgColor: "from-yellow-500/20 to-amber-500/20",
    category: "Gamification"
  },
  {
    icon: Globe,
    title: "Impact Visualization",
    description: "Real-time global impact tracking with detailed reporting and transparent environmental metrics",
    color: "text-indigo-400",
    bgColor: "from-indigo-500/20 to-blue-500/20",
    category: "Reporting"
  },
]

export function FeaturesSection() {
  return (
    <section className="section-padding container-padding">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-poppins">
            Platform <span className="gradient-text">Features</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Comprehensive tools for carbon trading, impact measurement, and sustainable investment management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="glass-card border-green-500/20 card-hover group">
              <CardHeader className="pb-4">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {feature.category}
                  </div>
                  <CardTitle className="text-lg font-semibold font-poppins group-hover:text-green-300 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="glass-strong p-8 rounded-2xl max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 font-poppins">
              Ready to make a <span className="gradient-text">sustainable impact</span>?
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Join thousands of organizations already trading carbon credits on our platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105">
                Start Trading
              </button>
              <button className="border border-green-500/30 text-green-300 hover:bg-green-500/10 font-semibold px-8 py-3 rounded-xl transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

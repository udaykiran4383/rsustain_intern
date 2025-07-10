import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp, Shield, Globe, Leaf, CheckCircle } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 container-padding bg-hero overflow-hidden">
      {/* Floating elements for visual interest */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-green-500/5 animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-teal-500/5 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 left-1/4 w-20 h-20 rounded-full bg-emerald-500/5 animate-float" style={{ animationDelay: '4s' }} />
      
      <div className="container mx-auto text-center relative z-10">
        <div className="glass-card p-8 sm:p-12 lg:p-16 max-w-6xl mx-auto animate-glow">
          {/* Trust badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-8">
            <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
            <span className="text-sm font-medium text-green-300">Verified Carbon Exchange Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 font-poppins leading-tight">
            Trade Carbon Credits{" "}
            <span className="gradient-text text-glow">Sustainably</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join the world's most trusted carbon credit exchange platform. Verify, trade, and retire carbon credits with
            complete transparency, blockchain-backed security, and real environmental impact.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 py-4 h-auto animate-glow" asChild>
              <Link href="/marketplace">
                <Leaf className="mr-2 h-5 w-5" />
                Explore Marketplace 
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-green-500/30 text-green-300 hover:bg-green-500/10 font-semibold px-8 py-4 h-auto" asChild>
              <Link href="/calculator">Calculate Your Impact</Link>
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-16">
            <div className="glass-strong p-6 lg:p-8 rounded-2xl card-hover group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 font-poppins">Verified Projects</h3>
              <p className="text-gray-400 leading-relaxed">All projects undergo rigorous verification by certified environmental experts and international standards</p>
            </div>
            
            <div className="glass-strong p-6 lg:p-8 rounded-2xl card-hover group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 font-poppins">Risk Assessment</h3>
              <p className="text-gray-400 leading-relaxed">Advanced AI-powered risk scoring and analysis for informed investment decisions</p>
            </div>
            
            <div className="glass-strong p-6 lg:p-8 rounded-2xl card-hover group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-green-500/20 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-8 w-8 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 font-poppins">Global Impact</h3>
              <p className="text-gray-400 leading-relaxed">Track real-world environmental impact and contribute to global climate action</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

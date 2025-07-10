"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MapPin, Star, TrendingUp, ShoppingCart } from "lucide-react"
import { api, type Project } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function ProjectGrid() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.getProjects()
        setProjects(data)
      } catch (error) {
        console.error("Error fetching projects:", error)
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [toast])

  const handleAddToCart = (project: Project) => {
    // TODO: Implement cart functionality
    toast({
      title: "Added to Cart",
      description: `${project.name} has been added to your cart.`,
    })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="glass-card border-white/20">
            <div className="animate-pulse">
              <div className="h-48 bg-gray-700 rounded-t-lg"></div>
              <div className="p-6 space-y-4">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-700 rounded w-full"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
        <p className="text-gray-400">Try adjusting your filters or check back later for new projects.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card key={project.id} className="glass-card border-white/20 hover:border-white/40 transition-all duration-300">
          <div className="relative">
            <img
              src={`/placeholder.svg?height=200&width=300`}
              alt={project.name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            <Badge className="absolute top-4 left-4 bg-green-600">{project.certification}</Badge>
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/50 rounded px-2 py-1">
              <Star className="h-3 w-3 text-yellow-400" />
              <span className="text-xs">{project.risk_score ? (10 - project.risk_score).toFixed(1) : "N/A"}</span>
            </div>
          </div>

          <CardHeader>
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="h-4 w-4" />
              {project.location}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Price per credit</span>
              <span className="text-lg font-bold text-green-400">${project.price_per_credit}</span>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Available Credits</span>
                <span>{project.available_credits.toLocaleString()}</span>
              </div>
              <Progress value={(project.available_credits / project.total_credits) * 100} className="h-2" />
            </div>

            {project.risk_score && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-sm">Risk Score: {project.risk_score.toFixed(1)}/10</span>
              </div>
            )}

            {project.sdg_goals && project.sdg_goals.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.sdg_goals.slice(0, 2).map((goal) => (
                  <Badge key={goal} variant="outline" className="text-xs">
                    {goal}
                  </Badge>
                ))}
                {project.sdg_goals.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{project.sdg_goals.length - 2} more
                  </Badge>
                )}
              </div>
            )}

            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleAddToCart(project)}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

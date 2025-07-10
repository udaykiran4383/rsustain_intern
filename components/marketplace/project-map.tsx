"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"

export function ProjectMap() {
  return (
    <Card className="glass-card border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Project Locations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-400">
            <MapPin className="h-12 w-12 mx-auto mb-4" />
            <p>Interactive map will be displayed here</p>
            <p className="text-sm">TODO: Integrate with mapping service</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

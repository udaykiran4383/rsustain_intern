"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const projectTypes = ["Reforestation", "Renewable Energy", "Energy Efficiency", "Methane Capture", "Ocean Conservation"]

const certifications = ["VERRA", "Gold Standard", "Carbon Credit Standard", "American Carbon Registry"]

const sdgGoals = ["Climate Action", "Clean Energy", "Life on Land", "Life Below Water", "Sustainable Cities"]

export function MarketplaceFilters() {
  const [priceRange, setPriceRange] = useState([0, 100])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([])

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price Range */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Price Range (${priceRange[0]} - ${priceRange[1]})
            </label>
            <Slider value={priceRange} onValueChange={setPriceRange} max={100} step={1} className="w-full" />
          </div>

          {/* Project Type */}
          <div>
            <label className="text-sm font-medium mb-3 block">Project Type</label>
            <div className="space-y-2">
              {projectTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTypes([...selectedTypes, type])
                      } else {
                        setSelectedTypes(selectedTypes.filter((t) => t !== type))
                      }
                    }}
                  />
                  <label htmlFor={type} className="text-sm">
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Certification */}
          <div>
            <label className="text-sm font-medium mb-3 block">Certification</label>
            <div className="space-y-2">
              {certifications.map((cert) => (
                <div key={cert} className="flex items-center space-x-2">
                  <Checkbox
                    id={cert}
                    checked={selectedCertifications.includes(cert)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCertifications([...selectedCertifications, cert])
                      } else {
                        setSelectedCertifications(selectedCertifications.filter((c) => c !== cert))
                      }
                    }}
                  />
                  <label htmlFor={cert} className="text-sm">
                    {cert}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Region */}
          <div>
            <label className="text-sm font-medium mb-3 block">Region</label>
            <Select>
              <SelectTrigger className="glass border-white/20">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="north-america">North America</SelectItem>
                <SelectItem value="south-america">South America</SelectItem>
                <SelectItem value="europe">Europe</SelectItem>
                <SelectItem value="asia">Asia</SelectItem>
                <SelectItem value="africa">Africa</SelectItem>
                <SelectItem value="oceania">Oceania</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SDG Goals */}
          <div>
            <label className="text-sm font-medium mb-3 block">SDG Goals</label>
            <div className="flex flex-wrap gap-2">
              {sdgGoals.map((goal) => (
                <Badge key={goal} variant="outline" className="cursor-pointer">
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Leaf, User, ShoppingCart, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()

  const navItems = [
    { href: "/marketplace", label: "Marketplace", icon: ShoppingCart },
    { href: "/projects", label: "Projects", icon: TrendingUp },
    { href: "/dashboard", label: "Dashboard", icon: User },
    { href: "/calculator", label: "Calculator", icon: Leaf },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 glass-strong border-b border-green-500/20 backdrop-blur-xl">
      <div className="container mx-auto container-padding h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <Leaf className="h-8 w-8 text-green-400 group-hover:text-green-300 transition-colors duration-300" />
            <div className="absolute inset-0 rounded-full bg-green-400/20 blur-lg group-hover:bg-green-300/30 transition-colors duration-300"></div>
          </div>
          <span className="text-xl font-bold gradient-text font-poppins">Rsustain</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => {
            const IconComponent = item.icon
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className="flex items-center space-x-2 text-gray-300 hover:text-green-300 transition-colors duration-300 group"
              >
                <IconComponent className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="hover:bg-green-500/10 hover:text-green-300">
                <ShoppingCart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-green-500/10 hover:text-green-300">
                <User className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                onClick={signOut}
                className="border-green-500/30 text-green-300 hover:bg-green-500/10 hover:border-green-400/50"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                asChild
                className="hover:bg-green-500/10 hover:text-green-300"
              >
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button 
                asChild
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
              >
                <Link href="/auth/signup">
                  <Leaf className="mr-2 h-4 w-4" />
                  Get Started
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="hover:bg-green-500/10">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="glass-strong border-green-500/20 backdrop-blur-xl">
            <div className="flex flex-col space-y-6 mt-8">
              {navItems.map((item) => {
                const IconComponent = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-3 text-gray-300 hover:text-green-300 transition-colors duration-300 group p-2 rounded-lg hover:bg-green-500/10"
                    onClick={() => setIsOpen(false)}
                  >
                    <IconComponent className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
              
              <div className="pt-6 border-t border-green-500/20">
                {user ? (
                  <Button 
                    variant="outline" 
                    onClick={signOut}
                    className="w-full border-green-500/30 text-green-300 hover:bg-green-500/10"
                  >
                    Sign Out
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      variant="ghost" 
                      asChild
                      className="w-full hover:bg-green-500/10 hover:text-green-300"
                    >
                      <Link href="/auth/signin">Sign In</Link>
                    </Button>
                    <Button 
                      asChild
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                      <Link href="/auth/signup">Get Started</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

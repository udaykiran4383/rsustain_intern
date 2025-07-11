"use client"

import { useContext } from "react"
import { AuthContext } from "@/components/auth-provider"

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

import { CreditRetirement } from "@/components/buyer/credit-retirement"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Retire Credits | Rsustain Carbon Exchange",
  description: "Permanently retire your carbon credits to claim environmental benefits",
}

export default function RetireCreditsPage() {
  return <CreditRetirement />
} 
import { Checkout } from "@/components/buyer/checkout"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout | Rsustain Carbon Exchange",
  description: "Complete your carbon credit purchase securely",
}

export default function CheckoutPage() {
  return <Checkout />
} 
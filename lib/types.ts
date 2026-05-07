export interface Profile {
  id: string
  credits: number
  created_at: string
}

export interface GeneratedSite {
  id: string
  user_id: string
  name: string
  description: string
  style: string
  html_code: string
  preview_slug: string
  created_at: string
  credits_used: number
}

export interface Payment {
  id: string
  user_id: string
  amount_usd: number
  credits_purchased: number
  nowpayments_payment_id: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export interface CreditPackage {
  id: string
  credits: number
  price: number
  popular?: boolean
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'starter', credits: 10, price: 5 },
  { id: 'pro', credits: 50, price: 20, popular: true },
  { id: 'enterprise', credits: 200, price: 70 },
]

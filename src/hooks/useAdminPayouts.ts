import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export type PayoutStatus = "Pending" | "Approved" | "On hold" | "Rejected";

export interface AdminPayout {
  id: string;
  seller: string;
  initials: string;
  amount: number;
  requested: string;
  bank: string;
  status: PayoutStatus;
  risk: "Low" | "Review" | "High";
  sales: number;
  accountAge: string;
  seller_id: string;
}

export function useAdminPayouts() {
  const [payouts, setPayouts] = useState<AdminPayout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchPayouts()
  }, [])

  async function fetchPayouts() {
    try {
      setLoading(true)
      setError(null)

      // Fetch payout requests with seller and payout account details
      const { data: payoutData, error: payoutError } = await supabase
        .from('payout_requests')
        .select(`
          *,
          profiles!payout_requests_seller_id_fkey (
            id,
            full_name,
            created_at
          ),
          payout_accounts (
            bank_name,
            account_type,
            account_number_last4
          )
        `)
        .order('created_at', { ascending: false })

      if (payoutError) throw payoutError

      // Fetch seller sales count for each seller
      const sellerIds = payoutData?.map(p => p.seller_id) || []
      const { data: ordersData } = await supabase
        .from('orders')
        .select('buyer_id, seller_id')
        .in('seller_id', sellerIds)

      // Calculate sales count per seller
      const salesCount: Record<string, number> = {}
      ordersData?.forEach(order => {
        if (order.seller_id) {
          salesCount[order.seller_id] = (salesCount[order.seller_id] || 0) + 1
        }
      })

      // Transform data and calculate risk
      const transformedPayouts: AdminPayout[] = (payoutData || []).map((payout: any) => {
        const seller = payout.profiles
        const account = payout.payout_accounts
        const sales = salesCount[payout.seller_id] || 0
        const accountAge = calculateAccountAge(seller?.created_at)
        const risk = calculateRisk(sales, accountAge, payout.amount)

        const initials = seller?.full_name
          ? seller.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
          : 'NA'

        const bankName = account?.bank_name || account?.account_type || 'Unknown'
        const accountLast4 = account?.account_number_last4 || 'N/A'

        return {
          id: payout.id,
          seller: seller?.full_name || 'Unknown Seller',
          initials,
          amount: payout.amount,
          requested: formatDate(payout.created_at),
          bank: `${bankName} ···· ${accountLast4}`,
          status: payout.status,
          risk,
          sales,
          accountAge,
          seller_id: payout.seller_id,
        }
      })

      setPayouts(transformedPayouts)
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching admin payouts:', err)
    } finally {
      setLoading(false)
    }
  }

  function calculateAccountAge(createdAt: string | null): string {
    if (!createdAt) return 'Unknown'

    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 30) return `${diffDays} days`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`
    return `${Math.floor(diffDays / 365)} years`
  }

  function calculateRisk(sales: number, accountAge: string, amount: number): "Low" | "Review" | "High" {
    // Calculate account age in days
    const ageInDays = accountAge.includes('days')
      ? parseInt(accountAge)
      : accountAge.includes('months')
      ? parseInt(accountAge) * 30
      : parseInt(accountAge) * 365

    // Risk scoring logic
    let riskScore = 0

    // Account age factor (newer accounts = higher risk)
    if (ageInDays < 30) riskScore += 3
    else if (ageInDays < 90) riskScore += 2
    else if (ageInDays < 180) riskScore += 1

    // Sales count factor (fewer sales = higher risk)
    if (sales < 10) riskScore += 3
    else if (sales < 50) riskScore += 2
    else if (sales < 100) riskScore += 1

    // Amount factor (larger amounts = higher risk)
    if (amount > 10000) riskScore += 2
    else if (amount > 5000) riskScore += 1

    // Determine risk level
    if (riskScore >= 6) return 'High'
    if (riskScore >= 3) return 'Review'
    return 'Low'
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }
    return date.toLocaleString('en-US', options)
  }

  async function updatePayoutStatus(payoutId: string, status: PayoutStatus) {
    try {
      const { error } = await supabase
        .from('payout_requests')
        .update({ status })
        .eq('id', payoutId)

      if (error) throw error

      // Refresh payouts
      await fetchPayouts()
    } catch (err) {
      console.error('Error updating payout status:', err)
      throw err
    }
  }

  return {
    payouts,
    loading,
    error,
    updatePayoutStatus,
    refetch: fetchPayouts,
  }
}

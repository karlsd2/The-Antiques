import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface SellerBalance {
  id: string
  seller_id: string
  available_balance: number
  pending_balance: number
  lifetime_earnings: number
  updated_at: string
  created_at: string
}

export interface WalletTransaction {
  id: string
  seller_id: string
  transaction_id: string
  date: string
  description: string
  type: 'Sale' | 'Fee' | 'Payout' | 'Refund'
  amount: number
  status: 'Available' | 'Pending' | 'Processed' | 'Completed' | 'Failed'
  order_id: string | null
  order_item_id: string | null
  created_at: string
}

export interface PayoutAccount {
  id: string
  seller_id: string
  account_type: 'bank' | 'gcash'
  bank_name: string | null
  account_number_last4: string | null
  account_holder_name: string | null
  is_verified: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface PayoutRequest {
  id: string
  seller_id: string
  payout_account_id: string | null
  amount: number
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed'
  processed_at: string | null
  created_at: string
}

export function useWallet(sellerId: string | null) {
  const [balance, setBalance] = useState<SellerBalance | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (sellerId) {
      fetchWalletData()
    } else {
      setBalance(null)
      setTransactions([])
      setPayoutAccount(null)
      setLoading(false)
    }
  }, [sellerId])

  async function fetchWalletData() {
    if (!sellerId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch seller balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('seller_balances')
        .select('*')
        .eq('seller_id', sellerId)
        .single()

      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError
      }

      setBalance(balanceData || {
        id: '',
        seller_id: sellerId,
        available_balance: 0,
        pending_balance: 0,
        lifetime_earnings: 0,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })

      // Fetch wallet transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])

      // Fetch default payout account
      const { data: accountData, error: accountError } = await supabase
        .from('payout_accounts')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_default', true)
        .single()

      if (accountError && accountError.code !== 'PGRST116') {
        throw accountError
      }

      setPayoutAccount(accountData || null)
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching wallet data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function requestPayout(amount: number) {
    if (!sellerId || !payoutAccount) {
      throw new Error('No payout account configured')
    }

    if (amount > (balance?.available_balance || 0)) {
      throw new Error('Insufficient available balance')
    }

    try {
      // Create payout request with status 'Completed' to trigger the payout transaction
      const { data: payoutData, error: payoutError } = await supabase
        .from('payout_requests')
        .insert({
          seller_id: sellerId,
          payout_account_id: payoutAccount.id,
          amount: amount,
          status: 'Completed',
          processed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (payoutError) throw payoutError

      // Refresh wallet data
      await fetchWalletData()

      return payoutData
    } catch (err) {
      console.error('Error requesting payout:', err)
      throw err
    }
  }

  return {
    balance,
    transactions,
    payoutAccount,
    loading,
    error,
    requestPayout,
    refetch: fetchWalletData
  }
}

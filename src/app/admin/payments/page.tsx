// src/app/admin/payments/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// ✅ YOUR ADMIN UUID (Hardcoded for security)
const ADMIN_UUID = '3ecee456-65d2-441b-a1cd-18b383fe2273'

interface Transaction {
  id: string
  user_id: string
  amount_php: number
  coins_to_grant: number
  status: string
  payment_method: string
  reference_number: string
  created_at: string
  user_email?: string
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // 🔒 SECURITY CHECK: Only allow your UUID
      if (!session || session.user.id !== ADMIN_UUID) {
        alert('🚫 Access Denied: Admins only.')
        router.replace('/')
        return
      }
      
      setIsAdmin(true)
      fetchTransactions()
    }
    
    checkAdminAndLoad()
  }, [router])

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Enrich with user emails
      const enrichedData = await Promise.all(
        (data || []).map(async (txn) => {
          // Note: In a real app, use a join or RPC. For now, we fetch user info.
          // Since we can't easily join auth.users in client-side select without RLS issues,
          // we'll just show the ID or fetch email if possible. 
          // For simplicity in this manual system, we'll try to get email from admin API if available,
          // otherwise just show ID.
          return {
            ...txn,
            user_email: txn.user_id.substring(0, 8) + '...' // Placeholder for ID
          }
        })
      )
      
      setTransactions(enrichedData)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      alert('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (txn: Transaction) => {
    if (!confirm(`Approve ${txn.amount_php} PHP?\nRef: ${txn.reference_number}\n\nThis will add ${txn.coins_to_grant} coins.`)) return

    try {
      // 1. Update Transaction Status
      const { error: txnError } = await supabase
        .from('transactions')
        .update({ status: 'approved' })
        .eq('id', txn.id)

      if (txnError) throw txnError

      // 2. Add Coins to User Profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('coins')
        .eq('user_id', txn.user_id)
        .single()

      const newBalance = (profile?.coins || 0) + txn.coins_to_grant

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ coins: newBalance })
        .eq('user_id', txn.user_id)

      if (profileError) throw profileError

      alert(`✅ Approved! ${txn.coins_to_grant} coins added.`)
      fetchTransactions() // Refresh list
    } catch (err: any) {
      alert(`❌ Approval failed: ${err.message}`)
    }
  }

  const handleReject = async (txn: Transaction) => {
    if (!confirm(`Reject payment Ref: ${txn.reference_number}?`)) return

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('id', txn.id)

      if (error) throw error
      alert('❌ Transaction rejected.')
      fetchTransactions()
    } catch (err: any) {
      alert(`❌ Rejection failed: ${err.message}`)
    }
  }

  if (!isAdmin) return null
  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-teal-400">Loading Admin Panel...</div>

  return (
    <main className="min-h-screen bg-gray-950 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">💸 Payment Verification</h1>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition"
          >
            ← Back to App
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-800 text-xs uppercase text-gray-300 font-medium">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Ref #</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No transactions found.</td>
                  </tr>
                ) : (
                  transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(txn.created_at).toLocaleDateString()} <br/>
                        <span className="text-xs text-gray-500">{new Date(txn.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{txn.user_email}</td>
                      <td className="px-6 py-4 text-teal-400 font-bold">₱{txn.amount_php}</td>
                      <td className="px-6 py-4 font-mono text-xs bg-gray-950 px-2 py-1 rounded border border-gray-700 text-white">
                        {txn.reference_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 capitalize">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          txn.payment_method === 'gcash' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'
                        }`}>
                          {txn.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          txn.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50' :
                          txn.status === 'approved' ? 'bg-green-900/30 text-green-400 border border-green-700/50' :
                          'bg-red-900/30 text-red-400 border border-red-700/50'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {txn.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleApprove(txn)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded transition active:scale-95"
                            >
                              ✅ Approve
                            </button>
                            <button 
                              onClick={() => handleReject(txn)}
                              className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-200 text-xs font-bold rounded border border-red-800 transition active:scale-95"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600 italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
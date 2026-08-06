// src/components/StoreModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface Package {
  id: string;
  amountPhp: number;
  coins: number;
  label: string;
  bestValue?: boolean;
}

type PaymentMethod = 'gcash' | 'paymaya';

const PACKAGES: Package[] = [
  { id: 'basic', amountPhp: 50, coins: 400, label: 'Starter Pack' },
  { id: 'standard', amountPhp: 100, coins: 1000, label: 'Standard Pack' },
  { id: 'premium', amountPhp: 250, coins: 3000, label: 'Best Value', bestValue: true },
];

export default function StoreModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // ✅ HISTORY STATES
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      // ✅ FETCH USER TRANSACTIONS IF LOGGED IN
      if (session) {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (data) setTransactions(data);
      }
    };
    
    getSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );
    
    return () => subscription.unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowInstructions(true);
    setShowHistory(false); // Ensure we aren't in history view when selecting
  };

  const handleConfirmPayment = async () => {
    if (!session?.user || !selectedPackage) {
      alert('Please log in first to submit payment');
      return;
    }

    // ✅ VALIDATION: Ensure reference number is provided
    if (!referenceNumber.trim()) {
      alert('⚠️ Please enter your GCash/PayMaya Reference Number to proceed.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: session.user.id,
          amount_php: selectedPackage.amountPhp,
          coins_to_grant: selectedPackage.coins,
          status: 'pending',
          payment_method: paymentMethod,
          reference_number: referenceNumber.trim()
        });

      if (error) throw error;
      
      alert(`✅ Payment submitted via ${paymentMethod === 'gcash' ? 'GCash' : 'PayMaya'}!\nRef: ${referenceNumber}\n\nAdmin will verify within 1-2 hours.`);
      
      // Refresh history immediately so they see the pending item
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (data) setTransactions(data);

      onClose();
      setReferenceNumber('');
      setShowInstructions(false);
    } catch (err: any) {
      console.error('Payment submission error:', err);
      alert(`❌ Submission failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment method details
  const PAYMENT_DETAILS = {
    gcash: {
      number: '0995 151 7170', 
      qrImage: '/gcash-qr.png', 
      color: 'teal'
    },
    paymaya: {
      number: '0995 151 7170', 
      qrImage: '/maya-qr.png', // Updated to match your file name
      color: 'blue'
    }
  };

  const currentPayment = PAYMENT_DETAILS[paymentMethod];

  return (
    // 1. Backdrop: Clicking here closes the modal
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* 2. Modal Box */}
      <div 
        className="bg-gray-900 border border-teal-800/50 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with History Toggle */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
          <h2 className="text-xl font-bold text-white">🪙 Coin Store</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full border border-gray-700 transition"
            >
              {showHistory ? '← Back to Store' : '📜 History'}
            </button>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ✅ MAIN CONTENT SWITCHER */}
        {showHistory ? (
          /* --- TRANSACTION HISTORY VIEW --- */
          <div className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Your Payments</h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No transactions yet.</p>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="mt-4 text-teal-400 text-sm hover:underline"
                >
                  Buy your first pack
                </button>
              </div>
            ) : (
              transactions.map((txn) => (
                <div key={txn.id} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex justify-between items-center">
                  <div>
                    <div className="text-white font-bold">₱{txn.amount_php}</div>
                    <div className="text-xs text-gray-400 font-mono">Ref: {txn.reference_number || 'N/A'}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(txn.created_at).toLocaleDateString()} • {txn.payment_method?.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      txn.status === 'approved' ? 'bg-green-900/30 text-green-400 border border-green-800' :
                      txn.status === 'rejected' ? 'bg-red-900/30 text-red-400 border border-red-800' :
                      'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                    }`}>
                      {txn.status.toUpperCase()}
                    </span>
                    {txn.status === 'approved' && (
                      <div className="text-xs text-teal-400 mt-1 font-bold">+{txn.coins_to_grant} 🪙</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* --- STORE CONTENT (Packages / Instructions) --- */
          !showInstructions ? (
            /* Package Selection */
            <div className="p-5 space-y-4">
              <p className="text-gray-300 text-sm mb-4">
                Support Lictech development while unlocking premium modules!
              </p>
              
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handleSelectPackage(pkg)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    pkg.bestValue 
                      ? 'border-yellow-600/50 bg-yellow-900/20 hover:border-yellow-500' 
                      : 'border-gray-700 hover:border-teal-600/50 bg-gray-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white">{pkg.label}</div>
                      <div className="text-teal-400 font-semibold mt-1">
                        ₱{pkg.amountPhp} → {pkg.coins.toLocaleString()} Coins
                      </div>
                    </div>
                    {pkg.bestValue && (
                      <span className="bg-yellow-600 text-xs text-white px-2 py-1 rounded-full">
                        BEST VALUE
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Payment Instructions with Method Toggle */
            <div className="p-5">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-white mb-2">
                  Pay ₱{selectedPackage?.amountPhp}
                </div>
                <p className="text-gray-400 text-sm">
                  Receive {selectedPackage?.coins.toLocaleString()} coins after verification
                </p>
              </div>

              {/* Payment Method Toggle */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setPaymentMethod('gcash')}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                    paymentMethod === 'gcash'
                      ? 'bg-teal-700 text-white border-2 border-teal-500'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-750'
                  }`}
                >
                   GCash
                </button>
                <button
                  onClick={() => setPaymentMethod('paymaya')}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                    paymentMethod === 'paymaya'
                      ? 'bg-blue-700 text-white border-2 border-blue-500'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-750'
                  }`}
                >
                   PayMaya
                </button>
              </div>

              {/* Payment Details */}
              <div className={`bg-${currentPayment.color}-900/20 rounded-lg p-4 mb-5 border border-${currentPayment.color}-800/50`}>
                <div className="text-center">
                  <div className={`text-${currentPayment.color}-400 font-mono text-lg mb-2`}>
                    {currentPayment.number}
                  </div>
                  <div className="text-gray-400 text-sm mb-3 capitalize">
                    {paymentMethod} Number
                  </div>
                  
                  {/* QR Code Display */}
                  <div className="mx-auto w-40 h-40 bg-white rounded-lg overflow-hidden mb-3">
                    <img 
                      src={currentPayment.qrImage} 
                      alt={`${paymentMethod} QR Code`}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/150x150/1f2937/FFF?text=QR+Missing';
                      }}
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Scan QR or send manually to number above
                  </p>
                </div>
              </div>

              {/* ✅ REFERENCE NUMBER INPUT (Allows Text for Maya) */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Reference Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="text"
                  maxLength={20}
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. 123456789012 or ABC123"
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all tracking-wider font-mono text-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can find this in your SMS confirmation or transaction history.
                </p>
              </div>

              <div className="space-y-3 mt-2">
                <button
                  onClick={handleConfirmPayment}
                  disabled={isSubmitting || !session}
                  className={`w-full bg-${currentPayment.color === 'teal' ? 'teal' : 'blue'}-600 hover:bg-${currentPayment.color === 'teal' ? 'teal' : 'blue'}-500 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? 'Submitting...' : !session ? 'Login Required' : `✅ I Have Paid via ${paymentMethod === 'gcash' ? 'GCash' : 'PayMaya'}`}
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="flex-1 text-gray-400 hover:text-white py-2 text-sm transition-colors border border-gray-700 rounded-lg hover:bg-gray-800"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 text-red-400 hover:text-red-300 py-2 text-sm transition-colors border border-red-900/50 rounded-lg hover:bg-red-900/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
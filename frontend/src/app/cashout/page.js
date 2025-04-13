'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { 
  CurrencyDollarIcon, 
  ArrowPathIcon, 
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  ArrowRightIcon,
  BanknotesIcon,
  PaperAirplaneIcon,
  BeakerIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51RAdrPPxzDzWsllx98949DKtUxhtXM85vOTVigPMdhCSARAeXfmQvvmZqTzjMUwwCDvUOHPblb294gmTUAe6e9bb00qaOIpHtQ');

export default function CashoutPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [earnings, setEarnings] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      router.push('/login');
      return;
    }
    
    fetchUserProfile(storedUsername);
  }, []);

  const fetchUserProfile = async (username) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/get_user_profile?username=${username}`);
      const data = await response.json();
      
      setUser(data);
      // Fetch earnings from the user data
      setEarnings(data.earnings || 0);
      
      // Fetch withdraw history
      fetchWithdrawHistory(username);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError("Failed to load user data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWithdrawHistory = async (username) => {
    try {
      const response = await fetch(`/api/get_withdraw_history?username=${username}`);
      
      if (response.ok) {
        const data = await response.json();
        setWithdrawHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error fetching withdraw history:", err);
      // Don't set error state here to avoid blocking the whole page
    }
  };

  const handleWithdrawAmountChange = (e) => {
    const value = e.target.value;
    // Only allow valid number inputs
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setWithdrawAmount(value);
    }
  };

  const handleSetMaxAmount = () => {
    setWithdrawAmount(earnings.toString());
  };

  const handleSubmitWithdraw = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid withdrawal amount");
      return;
    }
    
    if (amount > earnings) {
      setError("You cannot withdraw more than your available earnings");
      return;
    }
    
    if (paymentMethod === 'paypal' && !paymentDetails) {
      setError("Please enter your PayPal email");
      return;
    }
    
    if (paymentMethod === 'bank' && !paymentDetails) {
      setError("Please enter your bank account details");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      if (paymentMethod === 'stripe') {
        // Handle Stripe payment
        const stripe = await stripePromise;
        
        // Create payment intent on backend
        const createPaymentResponse = await fetch('/api/create_cashout_intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: user.username,
            amount: amount,
          }),
        });
        
        const paymentData = await createPaymentResponse.json();
        
        if (paymentData.message !== "success") {
          throw new Error(paymentData.message || "Failed to create payment");
        }
        
        // Confirm the payment
        const { error } = await stripe.confirmCardPayment(paymentData.clientSecret);
        
        if (error) {
          throw new Error(error.message);
        }
        
        // Payment successful
        setSuccessMessage(`Successfully processed withdrawal of $${amount.toFixed(2)}.`);
        setEarnings(prevEarnings => prevEarnings - amount);
        setWithdrawAmount("");
      } else {
        // Handle manual payment methods (PayPal, Bank Transfer)
        const response = await fetch('/api/process_withdrawal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: user.username,
            amount: amount,
            payment_method: paymentMethod,
            payment_details: paymentDetails
          }),
        });
        
        const data = await response.json();
        
        if (data.message === "success") {
          setSuccessMessage(`Successfully requested withdrawal of $${amount.toFixed(2)}. Our team will process it shortly.`);
          setEarnings(prevEarnings => prevEarnings - amount);
          setWithdrawAmount("");
        } else {
          setError(data.message || "Failed to process withdrawal");
        }
      }
      
      // Refresh withdrawal history
      fetchWithdrawHistory(user.username);
      
    } catch (err) {
      console.error("Error processing withdrawal:", err);
      setError(err.message || "Failed to process withdrawal. Please try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#DADDD8] flex items-center justify-center">
        <div className="text-2xl text-[#4B5842] flex items-center bg-white p-6 rounded-lg shadow-md border border-[#8FB339]">
          <ArrowPathIcon className="w-8 h-8 mr-2 animate-spin text-[#8FB339]" />
          Loading User Data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#DADDD8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-[#4B5842] rounded-2xl border border-[#8FB339] shadow-md p-8 mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-4 text-center flex items-center justify-center">
            <CurrencyDollarIcon className="w-10 h-10 mr-3 text-[#B7CE63]" />
            Cash Out Your Earnings
          </h1>
          <p className="text-[#C7D59F] text-center max-w-2xl mx-auto">
            Withdraw your earnings from completed plant bounty submissions.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Earnings Info */}
          <div className="bg-[#4B5842] shadow-lg rounded-lg p-6 border border-[#8FB339]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <UserIcon className="w-6 h-6 mr-2 text-[#B7CE63]" />
                Your Earnings
              </h2>
            </div>
            
            <div className="mb-6 p-6 bg-[#4B5842]/80 rounded-lg border border-[#8FB339] flex flex-col items-center">
              <p className="text-[#C7D59F] mb-2">Available Balance</p>
              <div className="text-4xl font-bold text-white flex items-center">
                <CurrencyDollarIcon className="w-8 h-8 mr-2 text-[#B7CE63]" />
                {earnings.toFixed(2)}
              </div>
              
              <div className="mt-6 w-full bg-[#3A4434] rounded-lg p-4 border border-[#8FB339]/50">
                <p className="text-sm text-[#C7D59F] mb-2">Earning Breakdown</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-white">
                    <span>Approved Submissions</span>
                    <span className="font-semibold">${(earnings * 0.8).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>Bonuses</span>
                    <span className="font-semibold">${(earnings * 0.2).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#3A4434] rounded-lg border border-[#8FB339]">
              <h3 className="text-white font-medium mb-2 flex items-center">
                <BeakerIcon className="w-4 h-4 mr-2 text-[#B7CE63]" />
                Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#4B5842]/80 p-3 rounded border border-[#8FB339]/50">
                  <p className="text-xs text-[#C7D59F]">Total Earned</p>
                  <p className="font-semibold text-white">${(earnings * 1.5).toFixed(2)}</p>
                </div>
                <div className="bg-[#4B5842]/80 p-3 rounded border border-[#8FB339]/50">
                  <p className="text-xs text-[#C7D59F]">Total Withdrawn</p>
                  <p className="font-semibold text-white">${((earnings * 1.5) - earnings).toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            {/* Withdrawal History */}
            <div className="mt-6 p-4 bg-[#3A4434] rounded-lg border border-[#8FB339]">
              <h3 className="text-white font-medium mb-3 flex items-center">
                <ClockIcon className="w-4 h-4 mr-2 text-[#B7CE63]" />
                Recent Withdrawals
              </h3>
              
              {withdrawHistory.length === 0 ? (
                <div className="text-center p-4 border border-dashed border-[#8FB339]/50 rounded-lg">
                  <p className="text-[#C7D59F] text-sm">No withdrawals yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {withdrawHistory.map((withdrawal, index) => (
                    <div 
                      key={index}
                      className="bg-[#4B5842]/80 p-3 rounded border border-[#8FB339]/50 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-white text-sm font-medium">${withdrawal.amount.toFixed(2)}</p>
                        <p className="text-xs text-[#C7D59F]">{new Date(withdrawal.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          withdrawal.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400' 
                            : withdrawal.status === 'pending' 
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                        }`}>
                          {withdrawal.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Withdraw Form */}
          <div className="bg-[#4B5842] shadow-lg rounded-lg p-6 border border-[#8FB339]">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <BanknotesIcon className="w-6 h-6 mr-2 text-[#B7CE63]" />
              Withdraw Funds
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-white">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-white flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2 text-green-400" />
                {successMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmitWithdraw} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#C7D59F] mb-2 flex items-center">
                  <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                  Withdrawal Amount
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white">$</span>
                  <input
                    type="text"
                    value={withdrawAmount}
                    onChange={handleWithdrawAmountChange}
                    className="pl-8 w-full px-4 py-3 rounded-lg bg-[#3A4434] border-2 border-[#8FB339] text-white placeholder-[#C7D59F]/70 focus:outline-none focus:ring-2 focus:ring-[#B7CE63] focus:border-transparent"
                    placeholder="0.00"
                  />
                  <button
                    type="button"
                    onClick={handleSetMaxAmount}
                    className="absolute inset-y-0 right-0 px-3 text-[#B7CE63] hover:text-white text-sm"
                  >
                    MAX
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#C7D59F] mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer transition flex items-center justify-center ${
                      paymentMethod === 'stripe' 
                        ? 'bg-[#B7CE63]/30 border-[#B7CE63]' 
                        : 'bg-[#3A4434] border-[#8FB339]/50 hover:bg-[#3A4434]/70'
                    }`}
                    onClick={() => setPaymentMethod('stripe')}
                  >
                    <span className={`font-medium ${paymentMethod === 'stripe' ? 'text-white' : 'text-[#C7D59F]'}`}>
                      <CreditCardIcon className="w-4 h-4 inline mr-1" />
                      Stripe
                    </span>
                  </div>
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer transition flex items-center justify-center ${
                      paymentMethod === 'paypal' 
                        ? 'bg-[#B7CE63]/30 border-[#B7CE63]' 
                        : 'bg-[#3A4434] border-[#8FB339]/50 hover:bg-[#3A4434]/70'
                    }`}
                    onClick={() => setPaymentMethod('paypal')}
                  >
                    <span className={`font-medium ${paymentMethod === 'paypal' ? 'text-white' : 'text-[#C7D59F]'}`}>
                      PayPal
                    </span>
                  </div>
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer transition flex items-center justify-center ${
                      paymentMethod === 'bank' 
                        ? 'bg-[#B7CE63]/30 border-[#B7CE63]' 
                        : 'bg-[#3A4434] border-[#8FB339]/50 hover:bg-[#3A4434]/70'
                    }`}
                    onClick={() => setPaymentMethod('bank')}
                  >
                    <span className={`font-medium ${paymentMethod === 'bank' ? 'text-white' : 'text-[#C7D59F]'}`}>
                      Bank
                    </span>
                  </div>
                </div>
              </div>
              
              {(paymentMethod === 'paypal' || paymentMethod === 'bank') && (
                <div>
                  <label className="block text-sm font-medium text-[#C7D59F] mb-2">
                    {paymentMethod === 'paypal' ? 'PayPal Email' : 'Bank Account Details'}
                  </label>
                  <input
                    type="text"
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#3A4434] border-2 border-[#8FB339] text-white placeholder-[#C7D59F]/70 focus:outline-none focus:ring-2 focus:ring-[#B7CE63] focus:border-transparent"
                    placeholder={paymentMethod === 'paypal' ? 'your-email@example.com' : 'Account number, routing number, etc.'}
                  />
                </div>
              )}
              
              {paymentMethod === 'stripe' && (
                <div className="bg-[#3A4434] p-4 rounded-lg border border-[#8FB339]/50">
                  <p className="text-sm text-[#C7D59F] mb-3">
                    You'll be redirected to a secure Stripe payment page to complete your withdrawal.
                  </p>
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-[#B7CE63] mr-2" />
                    <span className="text-white text-sm">Fast Processing (1-2 business days)</span>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isProcessing || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > earnings}
                className={`w-full py-3 px-4 rounded-md transition flex items-center justify-center font-medium border shadow-md ${
                  isProcessing || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > earnings
                    ? 'bg-[#4B5842]/50 text-[#C7D59F]/50 border-[#8FB339]/30 cursor-not-allowed'
                    : 'bg-[#8FB339] text-white hover:bg-[#B7CE63] border-[#B7CE63]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                    Withdraw ${parseFloat(withdrawAmount || 0).toFixed(2)}
                  </>
                )}
              </button>
              
              <p className="text-xs text-[#C7D59F] mt-2 text-center">
                By clicking this button, you agree to our withdrawal terms and conditions.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
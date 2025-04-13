'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { 
  UserIcon, 
  CurrencyDollarIcon, 
  BeakerIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  LockClosedIcon,
  FireIcon
} from '@heroicons/react/24/outline';

// Initialize Stripe with your public key
const stripePromise = loadStripe('pk_test_51RAdrPPxzDzWsllx98949DKtUxhtXM85vOTVigPMdhCSARAeXfmQvvmZqTzjMUwwCDvUOHPblb294gmTUAe6e9bb00qaOIpHtQ');

// Payment Form Component
const PaymentForm = ({ clientSecret, formData, username, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentMessage('Processing payment...');
    setPaymentError('');

    // Confirm payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setPaymentError(error.message || 'Payment failed. Please try again.');
      setPaymentMessage('');
      setIsProcessing(false);
      onPaymentError(error.message);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      setPaymentMessage('Payment successful! Creating your bounty...');
      
      try {
        console.log("Payment succeeded, creating bounty with payment ID:", paymentIntent.id);
        
        // Now create the bounty
        const response = await fetch('/api/create_bounty', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            username,
            reward: parseFloat(formData.reward),
            num_submissions_needed: parseInt(formData.num_submissions_needed),
            payment_id: paymentIntent.id,
            payment_amount: paymentIntent.amount / 100
          }),
        });
  
        console.log("Create bounty response status:", response.status);
        
        // Log the raw response first
        const responseText = await response.text();
        console.log("Create bounty raw response:", responseText);
        
        // Parse the response if it's valid JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log("Create bounty parsed response:", data);
        } catch (parseError) {
          console.error("Failed to parse create_bounty response as JSON:", parseError);
          setPaymentError("Server returned invalid response. Please contact support.");
          setIsProcessing(false);
          return;
        }
  
        if (data.message === 'success' && data.bounty_id) {
          console.log("Bounty created successfully with ID:", data.bounty_id);
          setPaymentMessage('Bounty created successfully!');
          
          // Wait a moment before redirecting to make sure user sees success message
          setTimeout(() => {
            onPaymentSuccess(data.bounty_id);
          }, 1500);
        } else {
          console.error("Failed to create bounty:", data);
          setPaymentError(data.message || 'Failed to create bounty');
          onPaymentError(data.message || 'Failed to create bounty');
        }
      } catch (err) {
        console.error("Error creating bounty:", err);
        setPaymentError(err.message || 'Failed to create bounty');
        onPaymentError(err.message || 'Failed to create bounty');
      }
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-6 border-2 border-[#8FB339] rounded-xl bg-[#4B5842] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4),0_4px_6px_-4px_rgba(0,0,0,0.3)]">
        <label className="block text-lg font-medium text-[#C7D59F] mb-4 flex items-center">
          <LockClosedIcon className="w-5 h-5 mr-3 text-[#B7CE63]" />
          Secure Payment Details
        </label>
        <div className="bg-[#3A4434] p-4 rounded-lg border border-[#8FB339]">
          <PaymentElement className="payment-element" />
        </div>
      </div>

      {paymentMessage && (
        <div className="p-4 bg-[#4B5842]/70 border-2 border-[#B7CE63] rounded-xl animate-pulse">
          <p className="text-white flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2 text-[#B7CE63]" />
            {paymentMessage}
          </p>
        </div>
      )}

      {paymentError && (
        <div className="p-4 bg-red-900/30 border-2 border-red-700 rounded-xl">
          <p className="text-white flex items-center">
            <XCircleIcon className="w-5 h-5 mr-2 text-red-400" />
            {paymentError}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-[#8FB339] to-[#B7CE63] text-white py-4 px-6 rounded-xl hover:from-[#B7CE63] hover:to-[#C7D59F] transition-all duration-300 flex items-center justify-center font-bold text-lg border-b-4 border-[#4B5842] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <CurrencyDollarIcon className="w-6 h-6 mr-2" />
        {isProcessing ? "Processing..." : `Pay $${(formData.reward * formData.num_submissions_needed).toFixed(2)}`}
      </button>
    </form>
  );
};

// Main Component
export default function CreateBounty() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    plant_species: '',
    reward: '',
    num_submissions_needed: '',
    additional_notes: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      router.push('/login');
      return;
    }
    setUsername(storedUsername);
  }, []);

  useEffect(() => {
    // Calculate total cost whenever reward or number of submissions changes
    if (formData.reward && formData.num_submissions_needed) {
      const cost = parseFloat(formData.reward) * parseInt(formData.num_submissions_needed);
      setTotalCost(cost);
    } else {
      setTotalCost(0);
    }
  }, [formData.reward, formData.num_submissions_needed]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return "Title is required";
    if (!formData.description.trim()) return "Description is required";
    if (!formData.plant_species.trim()) return "Plant species is required";
    if (!formData.reward || parseFloat(formData.reward) <= 0) return "Please enter a valid reward amount";
    if (!formData.num_submissions_needed || parseInt(formData.num_submissions_needed) <= 0) 
      return "Please enter a valid number of submissions";
    return "";
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
  
    setIsLoading(true);
    setError('');
  
    try {
      // Log the form data for debugging
      console.log("Form data:", formData);
      console.log("Total cost:", totalCost);
      
      // Format the request exactly as your backend expects
      const requestData = {
        username: username,
        eventID: "temp_bounty_" + Date.now().toString(),
        amount: totalCost
      };
      
      console.log("Sending request data:", requestData);
      
      // Create a payment intent
      const response = await fetch('/api/create_payment_intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      // Log the raw response for debugging
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      // Parse the response text first to see what we're getting
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      
      // Now parse as JSON if possible
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed response data:", data);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        setError("Server returned invalid JSON. Check console for details.");
        setIsLoading(false);
        return;
      }
  
      if (data.message === 'success' && data.clientSecret) {
        console.log("Setting client secret:", data.clientSecret);
        setClientSecret(data.clientSecret);
        setShowPayment(true);
      } else {
        console.error("Payment intent creation failed:", data);
        setError(data.message || 'Failed to create payment intent');
      }
    } catch (err) {
      console.error("Error creating payment intent:", err);
      setError(`Error: ${err.message || 'Something went wrong. Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (bountyId) => {
    // Redirect to the newly created bounty
    router.push(`/bounties/${bountyId}`);
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
    setShowPayment(false);
  };

  return (
    <div className="min-h-screen bg-[#DADDD8] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-[#8FB339]/30 blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#B7CE63]/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#4B5842]/10 blur-3xl"></div>
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-[#B7CE63]/10"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 15}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.5 + 0.2
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl w-full bg-gradient-to-br from-[#4B5842] to-[#3A4434] p-8 rounded-2xl border-2 border-[#8FB339] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.3),0_10px_10px_-5px_rgba(0,0,0,0.1)] backdrop-blur-sm relative z-10">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-[#B7CE63]/10 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#B7CE63] to-[#8FB339] rounded-lg blur opacity-30"></div>
              <h2 className="relative text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#C7D59F] to-[#B7CE63] text-center flex items-center justify-center gap-3 px-6 py-2">
                <BeakerIcon className="w-8 h-8 text-[#B7CE63]" />
                Create a New Plant Bounty
              </h2>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 text-white p-4 rounded-xl mb-6 text-center border-2 border-red-700/50">
              <XCircleIcon className="w-5 h-5 inline mr-2 text-red-400" />
              {error}
            </div>
          )}

          {!showPayment ? (
            <form onSubmit={handleProceedToPayment} className="space-y-6">
              <div className="p-5 border-2 border-[#8FB339] rounded-xl bg-[#4B5842] shadow-lg transition-transform duration-300 hover:shadow-[0_10px_15px_-3px_rgba(183,206,99,0.1),0_4px_6px_-4px_rgba(183,206,99,0.1)] hover:border-[#B7CE63] group">
                <label htmlFor="title" className="block text-base font-medium text-[#C7D59F] mb-2 flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2 text-[#B7CE63] group-hover:text-[#C7D59F] transition-colors duration-300" />
                  Bounty Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 bg-[#3A4434] border-2 border-[#8FB339] rounded-lg text-white placeholder-[#C7D59F]/70 focus:outline-none focus:ring-2 focus:ring-[#B7CE63] focus:border-transparent transition-all duration-300"
                  placeholder="Enter a descriptive title for your bounty"
                />
              </div>

              <div className="p-5 border-2 border-[#8FB339] rounded-xl bg-[#4B5842] shadow-lg transition-transform duration-300 hover:shadow-[0_10px_15px_-3px_rgba(183,206,99,0.1),0_4px_6px_-4px_rgba(183,206,99,0.1)] hover:border-[#B7CE63] group">
                <label htmlFor="description" className="block text-base font-medium text-[#C7D59F] mb-2 flex items-center">
                  <InformationCircleIcon className="w-5 h-5 mr-2 text-[#B7CE63] group-hover:text-[#C7D59F] transition-colors duration-300" />
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 bg-[#3A4434] border-2 border-[#8FB339] rounded-lg text-white placeholder-[#C7D59F]/70 focus:outline-none focus:ring-2 focus:ring-[#B7CE63] focus:border-transparent transition-all duration-300 resize-none"
                  placeholder="Provide detailed information about the plant research or removal mission"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-5 border-2 border-[#8FB339] rounded-xl bg-[#4B5842] shadow-lg transition-transform duration-300 hover:shadow-[0_10px_15px_-3px_rgba(183,206,99,0.1),0_4px_6px_-4px_rgba(183,206,99,0.1)] hover:border-[#B7CE63] group">
                  <label htmlFor="plant_species" className="block text-base font-medium text-[#C7D59F] mb-2 flex items-center">
                    <BeakerIcon className="w-5 h-5 mr-2 text-[#B7CE63] group-hover:text-[#C7D59F] transition-colors duration-300" />
                    Plant Species
                  </label>
                  <input
                    type="text"
                    id="plant_species"
                    name="plant_species"
                    required
                    value={formData.plant_species}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 bg-[#3A4434] border-2 border-[#8FB339] rounded-lg text-white placeholder-[#C7D59F]/70 focus:outline-none focus:ring-2 focus:ring-[#B7CE63] focus:border-transparent transition-all duration-300"
                    placeholder="Scientific or common name"
                  />
                </div>

                <div className="p-5 border-2 border-[#8FB339] rounded-xl bg-[#4B5842] shadow-lg transition-transform duration-300 hover:shadow-[0_10px_15px_-3px_rgba(183,206,99,0.1),0_4px_6px_-4px_rgba(183,206,99,0.1)] hover:border-[#B7CE63] group">
                  <label htmlFor="reward" className="block text-base font-medium text-[#C7D59F] mb-2 flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2 text-[#B7CE63] group-hover:text-[#C7D59F] transition-colors duration-300" />
                    Reward Amount ($)
                  </label>
                  <input
                    type="number"
                    id="reward"
                    name="reward"
                    required
                    min="0"
                    step="0.01"
                    value={formData.reward}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 bg-[#3A4434] border-2 border-[#8FB339] rounded-lg text-white placeholder-[#C7D59F]/70 focus:outline-none focus:ring-2 focus:ring-[#B7CE63] focus:border-transparent transition-all duration-300"
                    placeholder="Amount to be paid per submission"
                  />
                </div>
              </div>

              <div className="p-5 border-2 border-[#8FB339] rounded-xl bg-[#4B5842] shadow-lg transition-transform duration-300 hover:shadow-[0_10px_15px_-3px_rgba(183,206,99,0.1),0_4px_6px_-4px_rgba(183,206,99,0.1)] hover:border-[#B7CE63] group">
                <label htmlFor="num_submissions_needed" className="block text-base font-medium text-[#C7D59F] mb-2 flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-[#B7CE63] group-hover:text-[#C7D59F] transition-colors duration-300" />
                  Number of Submissions Needed
                </label>
                <input
                  type="number"
                  id="num_submissions_needed"
                  name="num_submissions_needed"
                  required
                  min="1"
                  value={formData.num_submissions_needed}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 bg-[#3A4434] border-2 border-[#8FB339] rounded-lg text-white placeholder-[#C7D59F]/70 focus:outline-none focus:ring-2 focus:ring-[#B7CE63] focus:border-transparent transition-all duration-300"
                  placeholder="Total number of submissions required"
                />
              </div>

              <div className="p-5 border-2 border-[#8FB339] rounded-xl bg-[#4B5842] shadow-lg transition-transform duration-300 hover:shadow-[0_10px_15px_-3px_rgba(183,206,99,0.1),0_4px_6px_-4px_rgba(183,206,99,0.1)] hover:border-[#B7CE63] group">
                <label htmlFor="additional_notes" className="block text-base font-medium text-[#C7D59F] mb-2 flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2 text-[#B7CE63] group-hover:text-[#C7D59F] transition-colors duration-300" />
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="additional_notes"
                  name="additional_notes"
                  rows={3}
                  value={formData.additional_notes}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 bg-[#3A4434] border-2 border-[#8FB339] rounded-lg text-white placeholder-[#C7D59F]/70 focus:outline-none focus:ring-2 focus:ring-[#B7CE63] focus:border-transparent transition-all duration-300 resize-none"
                  placeholder="Any extra information or specific requirements"
                />
              </div>

              {totalCost > 0 && (
                <div className="p-5 bg-gradient-to-r from-[#4B5842]/90 to-[#8FB339]/90 border-2 border-[#B7CE63] rounded-xl shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMTIxMjEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTZWMGg2djMwem0tNiAwaC02VjBoNnYzMHptLTYgMGgtNlYwaDZ2MzB6bS02IDBoLTZWMGg2djMwem0tNiAwaC02VjBoNnYzMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white text-lg font-semibold flex items-center">
                        <FireIcon className="w-6 h-6 mr-2 text-[#B7CE63]" />
                        Total Bounty Fund:
                      </p>
                      <p className="text-2xl font-bold text-[#C7D59F]">
                        ${totalCost.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex justify-between text-[#C7D59F]/80 text-sm mt-3 px-2">
                      <p>Reward per submission: <span className="font-semibold text-white">${formData.reward || 0}</span></p>
                      <p>×</p>
                      <p>Number of submissions: <span className="font-semibold text-white">{formData.num_submissions_needed || 0}</span></p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || totalCost <= 0}
                className="w-full bg-gradient-to-r from-[#8FB339] to-[#B7CE63] text-white py-4 px-6 rounded-xl hover:from-[#B7CE63] hover:to-[#C7D59F] transition-all duration-300 flex items-center justify-center font-bold text-lg border-b-4 border-[#4B5842] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="w-6 h-6 mr-2" />
                    Proceed to Payment
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-[#4B5842]/90 to-[#8FB339]/90 rounded-xl border-2 border-[#B7CE63] mb-4 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMTIxMjEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTZWMGg2djMwem0tNiAwaC02VjBoNnYzMHptLTYgMGgtNlYwaDZ2MzB6bS02IDBoLTZWMGg2djMwem0tNiAwaC02VjBoNnYzMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
                <div className="relative z-10">
                  <h3 className="text-[#C7D59F] font-bold text-xl mb-4 flex items-center">
                    <CheckCircleIcon className="w-6 h-6 mr-2" />
                    Bounty Summary
                  </h3>
                  <div className="space-y-3 text-white">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center p-2 border-b border-[#B7CE63]/20">
                      <span className="text-[#C7D59F] font-medium">Title:</span> 
                      <span className="md:text-right">{formData.title}</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center p-2 border-b border-[#B7CE63]/20">
                      <span className="text-[#C7D59F] font-medium">Species:</span> 
                      <span className="md:text-right">{formData.plant_species}</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center p-2 border-b border-[#B7CE63]/20">
                      <span className="text-[#C7D59F] font-medium">Reward:</span> 
                      <span className="md:text-right">${formData.reward} per submission</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center p-2 border-b border-[#B7CE63]/20">
                      <span className="text-[#C7D59F] font-medium">Submissions:</span> 
                      <span className="md:text-right">{formData.num_submissions_needed}</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center p-2 mt-2 bg-[#8FB339]/50 rounded-lg">
                      <span className="text-[#C7D59F] font-bold text-lg">Total:</span> 
                      <span className="md:text-right font-bold text-2xl text-[#C7D59F]">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {clientSecret && (
                <Elements stripe={stripePromise} options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#B7CE63',
                      colorBackground: '#3A4434',
                      colorText: 'white',
                      colorDanger: '#ef4444',
                      fontFamily: 'system-ui, sans-serif',
                      borderRadius: '8px',
                    }
                  }
                }}>
                  <PaymentForm 
                    clientSecret={clientSecret}
                    formData={formData}
                    username={username}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                </Elements>
              )}
              
              <button
                type="button"
                onClick={() => setShowPayment(false)}
                className="w-full bg-[#4B5842] text-[#B7CE63] py-3 px-4 rounded-xl hover:bg-[#3A4434] transition-all duration-300 flex items-center justify-center font-medium border-2 border-[#8FB339] mt-4 shadow-md hover:shadow-lg"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Back to Bounty Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
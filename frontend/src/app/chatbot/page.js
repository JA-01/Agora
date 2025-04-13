'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  PaperAirplaneIcon,
  ArrowPathIcon,
  HomeIcon,
  BeakerIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { Lightbulb } from 'lucide-react';

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Welcome to the Flora Identifier! Enter a flower name, and I'll provide ways to differentiate it from similar species."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const flowerName = input.trim();
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: flowerName }]);
    
    // Set loading state
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ask_chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: flowerName,
          system_message: "You are a botanical expert specializing in flower identification. Provide clear, accurate, and concise information about how to identify and differentiate flowers from similar species."
        }),
      });
      
      const data = await response.json();
      
      if (data.message === 'success') {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        throw new Error(data.error || 'Failed to get a response');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I couldn't process that request. Please try again with a different flower name.",
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    
    return (
      <div 
        key={index} 
        className={`mb-4 ${isUser ? 'ml-auto' : 'mr-auto'} max-w-[80%]`}
      >
        <div 
          className={`p-4 rounded-2xl shadow-md ${
            isUser 
              ? 'bg-[#4B5842] text-white border border-[#8FB339]' 
              : message.isError 
                ? 'bg-white text-red-600 border border-red-200' 
                : 'bg-white text-[#4B5842] border border-[#8FB339]'
          }`}
        >
          <div className="flex items-start">
            {!isUser && (
              <div className="p-2 bg-[#C7D59F] rounded-full mr-3 border border-[#B7CE63]">
                <Lightbulb className="w-5 h-5 text-[#4B5842]" />
              </div>
            )}
            <div className={`${isUser ? 'ml-auto' : ''}`}>
              <div className="font-medium mb-1">
                {isUser ? 'You asked about:' : 'Flora Identifier:'}
              </div>
              <div className="whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
            {isUser && (
              <div className="p-2 bg-[#C7D59F] rounded-full ml-3 border border-[#B7CE63]">
                <BeakerIcon className="w-5 h-5 text-[#4B5842]" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#DADDD8] flex flex-col">
      {/* Header */}
      <div className="bg-[#4B5842] border-b border-[#8FB339] shadow-md p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2 text-[#B7CE63]" />
            Flora Identifier
          </h1>
          <Link 
            href="/dashboard" 
            className="flex items-center text-white hover:text-[#C7D59F] transition"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 flex flex-col">
        <div className="bg-white rounded-2xl border border-[#8FB339] shadow-md p-4 mb-4 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
          <div className="flex flex-col">
            {messages.map(renderMessage)}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a flower name (e.g., 'Tulip', 'Rose', 'Sunflower')"
            className="w-full p-4 pr-20 rounded-xl border border-[#8FB339] focus:outline-none focus:ring-2 focus:ring-[#B7CE63] text-[#4B5842]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-lg ${
              isLoading 
                ? 'bg-[#C7D59F] cursor-not-allowed' 
                : 'bg-[#8FB339] hover:bg-[#B7CE63]'
            } transition-all duration-200 text-white shadow-md`}
          >
            {isLoading ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-4 text-center text-[#4B5842] text-sm">
          <p>Ask about any flower to learn how to identify it in the wild.</p>
          <p className="mt-1">
            Example flowers: Lavender, Dahlia, Chrysanthemum, Daffodil, Lily
          </p>
        </div>
      </div>
    </div>
  );
}
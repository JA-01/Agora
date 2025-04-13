import Link from 'next/link';
import { HomeIcon } from '@heroicons/react/24/outline';

export default function BackToDashboard() {
  return (
    <div className="mt-8 flex justify-center">
      <Link 
        href="/dashboard" 
        className="bg-[#4B5842] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#5a6a4f] transition-all duration-300 flex items-center border border-[#8FB339] shadow-md"
      >
        <HomeIcon className="w-5 h-5 mr-2" />
        Back to Dashboard
      </Link>
    </div>
  );
}
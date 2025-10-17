'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Subscription {
  id: string;
  planType: string;
  status: string;
  stripeCurrentPeriodEnd: string;
  createdAt: string;
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      fetchSubscriptionDetails();
    }
  }, [session]);

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your subscription is now active.
        </p>

        {subscription && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Subscription Details</h3>
            <p className="text-sm text-gray-600">
              <strong>Plan:</strong> {subscription.planType.toLowerCase().replace('_', ' ')}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Expires:</strong> {new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Status:</strong> <span className="text-green-600 font-semibold">{subscription.status}</span>
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200 block"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/admin/upgrade"
            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition duration-200 block"
          >
            View Other Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
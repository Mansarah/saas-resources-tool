// app/admin/success/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle2, Calendar, Crown, Zap, ArrowRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Subscription {
  id: string;
  planType: string;
  status: string;
  stripeCurrentPeriodEnd: string;
  createdAt: string;
  stripeCurrentPeriodStart: string;
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      fetchSubscriptionDetails();
    }
  }, [session]);

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await fetch('/api/admin/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      } else {
        setError('Failed to fetch subscription details');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setError('Error loading subscription details');
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'SEVEN_DAYS':
        return Zap;
      case 'FOURTEEN_DAYS':
        return Crown;
      case 'ONE_MONTH':
        return Calendar;
      default:
        return CheckCircle2;
    }
  };

  const formatPlanName = (planType: string) => {
    return planType.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <h2 className="text-sm font-medium text-gray-700">Setting up your account...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-sm text-gray-600">
            Your subscription is now active with full access to all features.
          </p>
        </div>

        {/* Subscription Details */}
        <div className="bg-white rounded-lg border border-green-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                Active
              </Badge>
              <span className="text-xs text-gray-500">Subscription</span>
            </div>
            {subscription && (
              <div className="text-right">
                <p className="text-xs font-medium text-gray-900">
                  {calculateDaysRemaining(subscription.stripeCurrentPeriodEnd)} days left
                </p>
              </div>
            )}
          </div>
          
          {subscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center">
                    {(() => {
                      const IconComponent = getPlanIcon(subscription.planType);
                      return <IconComponent className="h-4 w-4 text-indigo-600" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {formatPlanName(subscription.planType)}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Renews {new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-gray-500 text-sm">No subscription details found.</p>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button 
          onClick={() => router.push('/admin/subscription')}
            className="w-full h-11 justify-between"
            size="sm"
          >
            <span className="flex items-center gap-2">
       Manage Subscription
            </span>
            <Settings className="h-4 w-4" />
          </Button>
          
         
        </div>

        {/* Help Text */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            Need help? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
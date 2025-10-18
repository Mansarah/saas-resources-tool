// app/admin/success/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { CheckCircle2, Calendar, Crown, Zap, ArrowRight, History, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Setting up your account...</h2>
          <p className="text-gray-500 mt-2">This will just take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Welcome aboard! Your subscription is now active and you have full access to all features.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscription Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  Subscription Active
                </CardTitle>
                <CardDescription>
                  Your plan details and next steps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscription ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Plan Type</p>
                        <div className="flex items-center gap-2 mt-1">
                          {(() => {
                            const IconComponent = getPlanIcon(subscription.planType);
                            return <IconComponent className="h-4 w-4 text-indigo-600" />;
                          })()}
                          <p className="font-semibold text-gray-900">
                            {formatPlanName(subscription.planType)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <p className="font-semibold text-green-600 capitalize">{subscription.status.toLowerCase()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Expires</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Days Remaining</p>
                        <p className="font-semibold text-blue-600">
                          {calculateDaysRemaining(subscription.stripeCurrentPeriodEnd)} days
                        </p>
                      </div>
                    </div>
                    
                      <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Get started with these actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    className="h-auto py-4 justify-start"
                    variant="outline"
                  >
                    <div className="text-left">
                      <p className="font-semibold">Go to Dashboard</p>
                      <p className="text-sm text-gray-500">Start using the application</p>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </Button>
                  
                  <Button 
                    onClick={() => router.push('/admin/subscription')}
                    className="h-auto py-4 justify-start"
                    variant="outline"
                  >
                    <div className="text-left">
                      <p className="font-semibold">Manage Subscription</p>
                      <p className="text-sm text-gray-500">View history and upgrade</p>
                    </div>
                    <Settings className="ml-auto h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No subscription details found.</p>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
         
          </div>

       
        </div>
      </div>
    </div>
  );
}
// app/admin/subscription/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Crown, 
  Zap, 
  ArrowUpRight, 
  History, 
  Plus, 
  CreditCard,
  CheckCircle2,
  Clock,
  Download
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Subscription {
  id: string;
  planType: string;
  status: string;
  stripeCurrentPeriodEnd: string;
  stripeCurrentPeriodStart: string;
  createdAt: string;
}

interface PaymentHistory {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  planType: string;
  stripeSessionId?: string;
  isUpdatedPlan?: string;
}

export default function SubscriptionDashboard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      fetchSubscriptionData();
    }
  }, [session]);

  const fetchSubscriptionData = async () => {
    try {
      const [subResponse, paymentsResponse] = await Promise.all([
        fetch('/api/admin/subscription'),
        fetch('/api/admin/payment-history')
      ]);

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);
      }

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPaymentHistory(paymentsData);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
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
        return Zap;
    }
  };

  const formatPlanName = (planType: string) => {
    return planType.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'canceled':
        return 'destructive';
      case 'past_due':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
      case 'canceled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getPlanAmount = (planType: string) => {
    const prices = {
      'SEVEN_DAYS': 129,
      'FOURTEEN_DAYS': 299,
      'ONE_MONTH': 499
    };
    return prices[planType as keyof typeof prices] || 0;
  };

  const handleUpgrade = () => {
    router.push('/admin/upgrade');
  };

  const handleDownloadInvoice = async (sessionId: string) => {
    // Implement invoice download logic
    console.log('Download invoice for session:', sessionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
            <p className="text-gray-600 mt-2">Manage your plans and view payment history</p>
          </div>
          <Button onClick={handleUpgrade}>
            <Plus className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Payment History Table */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Payment History
                </CardTitle>
                <CardDescription>
                  Your recent payments and transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentHistory.length > 0 ? (
                  <div className="rounded-md border">
               
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead>Plan</TableHead>
      <TableHead>Amount</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Upgrade Info</TableHead> {/* New column */}
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {paymentHistory.map((payment) => (
      <TableRow key={payment.id}>
        <TableCell className="font-medium">
          {new Date(payment.createdAt).toLocaleDateString()}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {(() => {
              const IconComponent = getPlanIcon(payment.planType);
              return <IconComponent className="h-4 w-4 text-indigo-600" />;
            })()}
            {formatPlanName(payment.planType)}
          </div>
        </TableCell>
        <TableCell>₹{payment.amount}</TableCell>
        <TableCell>
          <Badge variant={getPaymentStatusVariant(payment.status)}>
            {payment.status}
          </Badge>
        </TableCell>
        <TableCell>
          {payment.isUpdatedPlan ? (
            <div className="max-w-xs">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                Plan Updated
              </Badge>
              <p className="text-xs text-gray-600 mt-1">{payment.isUpdatedPlan}</p>
            </div>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => payment.stripeSessionId && handleDownloadInvoice(payment.stripeSessionId)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No payment history found</p>
                    <Button onClick={handleUpgrade} className="mt-4">
                      Get Started
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Active Plan Card */}
          <div className="space-y-6">
            {/* Active Plan Card */}
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-white">
                  <span>Active Plan</span>
                  <CreditCard className="h-5 w-5" />
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Your current subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscription ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        {(() => {
                          const IconComponent = getPlanIcon(subscription.planType);
                          return <IconComponent className="h-6 w-6 text-white" />;
                        })()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {formatPlanName(subscription.planType)}
                        </h3>
                        <Badge variant="secondary" className="bg-white/20 text-white border-0">
                          {subscription.status.toLowerCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-indigo-100">Plan Amount</span>
                        <span className="font-semibold">
                          ₹{getPlanAmount(subscription.planType)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-indigo-100">Days Remaining</span>
                        <span className="font-semibold">
                          {calculateDaysRemaining(subscription.stripeCurrentPeriodEnd)} days
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-indigo-100">Renewal Date</span>
                        <span className="font-semibold">
                          {new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/20">
                      <div className="flex items-center gap-2 text-sm text-indigo-100">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Active until {new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-indigo-200" />
                    <p className="text-indigo-100 mb-4">No active subscription</p>
                    <Button 
                      onClick={handleUpgrade}
                      className="w-full bg-white text-indigo-600 hover:bg-indigo-50"
                    >
                      Choose a Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

           
          </div>
        </div>
      </div>
    </div>
  );
}
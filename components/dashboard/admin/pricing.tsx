/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import * as PricingCard from '@/components/pricing-card';
import {
  CheckCircle2,
  XCircleIcon,
  Calendar,
  Crown,
  Zap,
} from 'lucide-react';
import moment from 'moment';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const plans = [
  {
    id: 'seven_days',
    name: '7 Days',
    price: '129',
    originalPrice: '399',
    days: 7,
    features: [
      'Full access to all features',
      'Priority support',
      '7-day unlimited usage',
    ],
    lockedFeatures: [
      'Extended access',
      'Advanced analytics',
    ],
    popular: false,
    icon: Zap
  },
  {
    id: 'fourteen_days',
    name: '14 Days',
    price: '299',
    originalPrice: '699',
    days: 14,
    features: [
      'Everything in 7-day plan',
      'Extended 14-day access',
      'Export capabilities'
    ],
    lockedFeatures: [
      'Dedicated account manager'
    ],
    popular: true,
    icon: Crown
  },
  {
    id: 'one_month',
    name: '1 Month',
    price: '499',
    originalPrice: '999',
    days: 30,
    features: [
      'Everything in 14-day plan',
      'Full month of access',
      'Premium templates',
    ],
    lockedFeatures: [],
    popular: false,
    icon: Calendar
  }
];

export default function Pricing() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscription = async (planId: string, days: number) => {
    if (status === 'loading') {
      alert('Please wait while we check your authentication...');
      return;
    }

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    setLoading(planId);

    try {
      const response = await fetch('/api/admin/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          days,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      alert(error.message || 'Failed to process payment. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const PlanCard = ({ plan }: { plan: typeof plans[0] }) => {
    const IconComponent = plan.icon;
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
      handleSubscription(plan.id, plan.days);
    };

    return (
      <PricingCard.Card 
        className={cn(
          'transition-all duration-300 ease-out cursor-pointer',
          'hover:scale-105 hover:shadow-2xl   hover:z-10',
          'border-2 border-transparent hover:border-purple-200/50',
          plan.popular 
            ? 'ring-2 ring-purple-600 shadow-lg hover:ring-purple-400 hover:shadow-xl' 
            : 'shadow-md hover:shadow-xl'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <PricingCard.Header>
          <PricingCard.Plan>
            <PricingCard.PlanName className="transition-transform duration-300 hover:scale-110">
              <IconComponent 
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isHovered && "scale-125 text-purple-600"
                )} 
                aria-hidden="true" 
              />
              <span className="text-muted-foreground text-sm">{plan.name}</span>
            </PricingCard.PlanName>
            {plan.popular && (
              <PricingCard.Badge className="animate-pulse hover:animate-none">
                Popular
              </PricingCard.Badge>
            )}
          </PricingCard.Plan>
          
          <PricingCard.Price className="transition-all duration-300 hover:transform hover:scale-105">
            <PricingCard.MainPrice className="text-2xl transition-all duration-300 hover:text-purple-600">
              {plan.price} Rs
            </PricingCard.MainPrice>
            <PricingCard.Period className="text-sm">/{plan.days} days</PricingCard.Period>
            <PricingCard.OriginalPrice className="ml-auto text-sm transition-opacity duration-300 hover:opacity-100">
              {plan.originalPrice} Rs
            </PricingCard.OriginalPrice>
          </PricingCard.Price>
          
          <Button
            className={cn(
              'w-full font-semibold text-white text-sm py-2 transition-all duration-300',
              'transform hover:scale-105 hover:shadow-lg',
              'relative overflow-hidden group',
              plan.popular
                ? 'bg-gradient-to-b from-purple-800 to-purple-900 shadow-[0_5px_15px_rgba(99,102,241,0.3)] hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)]'
                : 'bg-gradient-to-b from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800'
            )}
            onClick={handleClick}
            disabled={loading === plan.id}
          >
           
            <div className={cn(
              "absolute inset-0 transform -skew-x-12 transition-all duration-700",
              "bg-gradient-to-r from-transparent via-white/20 to-transparent",
              "translate-x-[-100%] group-hover:translate-x-[100%]"
            )} />
            
            {loading === plan.id ? (
              <span className="flex items-center justify-center relative z-10">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                Processing...
              </span>
            ) : (
              <span className="relative z-10 flex items-center justify-center">
                   {session?.user?.subscriptionStatus === "ACTIVE" &&
                              !moment().isAfter(moment(session?.user?.stripeCurrentPeriodEnd)) ?(
<p> Upgrade</p>

                              ):(<p> Get Started   </p>)}
               
                <svg 
                  className="ml-2 h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            )}
          </Button>
        </PricingCard.Header>
        
        <PricingCard.Body className="space-y-3">
          <PricingCard.List className="space-y-2">
            {plan.features.map((item, index) => (
              <PricingCard.ListItem 
                key={index} 
                className="text-sm transition-all duration-300 hover:translate-x-1 hover:text-green-600"
              >
                <span className="mt-0.5 transition-transform duration-300 hover:scale-125">
                  <CheckCircle2
                    className="h-3.5 w-3.5 text-green-500"
                    aria-hidden="true"
                  />
                </span>
                <span>{item}</span>
              </PricingCard.ListItem>
            ))}
          </PricingCard.List>
          
          {plan.lockedFeatures.length > 0 && (
            <>
              <PricingCard.Separator className="text-xs transition-opacity duration-300 hover:opacity-100">
                Upgrade for more
              </PricingCard.Separator>
              <PricingCard.List className="space-y-2">
                {plan.lockedFeatures.map((item, index) => (
                  <PricingCard.ListItem 
                    key={index} 
                    className="opacity-75 text-sm transition-all duration-300 hover:opacity-100 hover:translate-x-1"
                  >
                    <span className="mt-0.5 transition-transform duration-300 hover:scale-125">
                      <XCircleIcon
                        className="text-destructive h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </span>
                    <span>{item}</span>
                  </PricingCard.ListItem>
                ))}
              </PricingCard.List>
            </>
          )}
        </PricingCard.Body>
      </PricingCard.Card>
    );
  };

  return (
    <main className={cn(' w-full py-4 px-4 relative bg-gradient-to-br from-transparent via-transparent to-purple-300/25')}>
      <div className="absolute inset-0 overflow-hidden">
           <div 
             className="absolute inset-0 opacity-10"
             style={{
               backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)',
               backgroundSize: '50px 50px',
             }}
           ></div>
           <div 
             className="absolute inset-0 opacity-20"
             style={{
               backgroundImage: 'radial-gradient(circle at 70% 30%, #7c3aed 1px, transparent 1.5px), radial-gradient(circle at 30% 70%, #db2777 1px, transparent 1.5px)',
               backgroundSize: '60px 60px',
               animation: 'moveBackground 20s infinite alternate',
             }}
           ></div>
           </div>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-transparent  bg-gradient-to-r from-purple-900  to-purple-900 sm:text-3xl bg-clip-text transition-all duration-300 hover:scale-105">
            Choose Your Plan
          </h1>
          <p className=" max-w-md mx-auto text-muted-foreground text-sm transition-all duration-300 hover:text-foreground">
            Select the perfect plan for your needs
          </p>
          
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground transition-all duration-300 hover:scale-105 hover:text-foreground">
            All plans include a 14-day money-back guarantee.
          </p>
        </div>
      </div>
    </main>
  );
}
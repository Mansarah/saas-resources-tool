/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const priceIds = {
  seven_days: 'price_1SJ2cWSDAHRRkkgb1jf2wJb4', 
  fourteen_days: 'price_1SJ2etSDAHRRkkgbXskvOwl7', 
  one_month: 'price_1SJ2frSDAHRRkkgbHxWuLl8e', 
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, days } = await request.json();

    // Validate planId
    if (!priceIds[planId as keyof typeof priceIds]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create or get Stripe customer
    let customerId: string;
    
    // Check if user already has a Stripe customer ID
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
    });

    if (existingSubscription?.stripeCustomerId) {
      customerId = existingSubscription.stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || `${user.firstName} ${user.lastName}` || user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session with return_url instead of success_url/cancel_url
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceIds[planId as keyof typeof priceIds],
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/upgrade`,
      metadata: {
        userId: user.id,
        planId,
        days: days.toString(),
      },
    });

    // Return the URL for client-side redirection
    return NextResponse.json({ 
      url: checkoutSession.url 
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const payload = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  const { userId, planId, days } = session.metadata;

  if (!userId || !planId || !days) {
    console.error('Missing metadata in session:', session.metadata);
    return;
  }

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(days));

  // Map planId to PlanType
  const planTypeMap: { [key: string]: any } = {
    seven_days: 'SEVEN_DAYS',
    fourteen_days: 'FOURTEEN_DAYS',
    one_month: 'ONE_MONTH',
  };

  const planType = planTypeMap[planId];

  if (!planType) {
    console.error('Invalid plan type:', planId);
    return;
  }

  try {
    // Create or update subscription
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        stripePriceId: session.metadata.planId,
        planType: planType,
        stripeCurrentPeriodEnd: new Date(expiresAt),
        status: 'ACTIVE',
      },
      create: {
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        stripePriceId: session.metadata.planId,
        planType: planType,
        stripeCurrentPeriodEnd: new Date(expiresAt),
        status: 'ACTIVE',
      },
    });

    console.log(`Subscription created for user ${userId} with ${days} days`);
  } catch (error) {
    console.error('Error updating database:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
        status: subscription.status === 'active' ? 'ACTIVE' : 'INACTIVE',
      },
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
      },
    });
  } catch (error) {
    console.error('Error deleting subscription:', error);
  }
}
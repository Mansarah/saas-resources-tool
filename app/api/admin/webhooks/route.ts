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

  // Calculate expiration date from today
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
    // Check if user has ANY subscription (active or inactive)
    const existingSubscription = await prisma.subscription.findFirst({
      where: { 
        userId: userId
      },
      orderBy: { createdAt: 'desc' } 
    });

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      // Case 1: User has ACTIVE subscription - EXTEND it
      let newEndDate: Date;
      
      if (existingSubscription.stripeCurrentPeriodEnd) {
        // If there's an existing end date, extend from there
        const currentEndDate = new Date(existingSubscription.stripeCurrentPeriodEnd);
        newEndDate = new Date(currentEndDate);
        newEndDate.setDate(newEndDate.getDate() + parseInt(days));
      } else {
        // If no existing end date, start from today
        newEndDate = new Date(expiresAt);
      }

      // Check if this is a plan upgrade/downgrade
      const isPlanChanged = existingSubscription.planType !== planType;
      const previousPlanEndDate = existingSubscription.stripeCurrentPeriodEnd;
      
      let isUpdatedPlanValue: string | null = null;
      
      if (isPlanChanged) {
        // Create upgrade message with previous plan and date info
        const previousPlanName = formatPlanNameForUpdate(existingSubscription.planType);
        const newPlanName = formatPlanNameForUpdate(planType);
        const previousDate = previousPlanEndDate 
          ? new Date(previousPlanEndDate).toLocaleDateString() 
          : 'N/A';
        
        isUpdatedPlanValue = `Upgraded from ${previousPlanName} (ending ${previousDate}) to ${newPlanName}`;
      }

      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          stripePriceId: session.metadata.planId,
          stripeCurrentPeriodEnd: newEndDate,
          planType: planType, 
          status: 'ACTIVE',
          isUpdatedPlan: isUpdatedPlanValue, 
        },
      });

      console.log(`Extended ACTIVE subscription for user ${userId} by ${days} days`);
      if (isPlanChanged) {
        console.log(`Plan upgraded from ${existingSubscription.planType} to ${planType}`);
      }

    } else if (existingSubscription) {
      // Case 2: User has EXPIRED/INACTIVE subscription - REACTIVATE it with new dates
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          stripePriceId: session.metadata.planId,
          planType: planType,
          stripeCurrentPeriodEnd: new Date(expiresAt), 
          status: 'ACTIVE',
          isUpdatedPlan: null, 
        },
      });

      console.log(`Reactivated EXPIRED subscription for user ${userId} with ${days} days`);

    } else {
      // Case 3: User has NO subscription - CREATE new one
      await prisma.subscription.create({
        data: {
          userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          stripePriceId: session.metadata.planId,
          planType: planType,
          stripeCurrentPeriodEnd: new Date(expiresAt),
          status: 'ACTIVE',
          isUpdatedPlan: null,
        },
      });

      console.log(`New subscription created for user ${userId} with ${days} days`);
    }
  } catch (error) {
    console.error('Error updating database:', error);
  }
}


function formatPlanNameForUpdate(planType: string): string {
  const planNames: { [key: string]: string } = {
    'SEVEN_DAYS': '7 Days Plan',
    'FOURTEEN_DAYS': '14 Days Plan', 
    'ONE_MONTH': '1 Month Plan'
  };
  return planNames[planType] || planType;
}
async function handleSubscriptionUpdated(subscription: any) {
  try {
    const existingSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (existingSubscription) {
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
          status: subscription.status === 'active' ? 'ACTIVE' : 'INACTIVE',
        },
      });
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    const existingSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (existingSubscription) {
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: 'CANCELED',
        },
      });
    }
  } catch (error) {
    console.error('Error deleting subscription:', error);
  }
}
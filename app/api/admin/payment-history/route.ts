// app/api/admin/payment-history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscription: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Convert subscription data to payment history
    const paymentHistory = user.subscription.map(sub => ({
      id: sub.id,
      amount: getPlanAmount(sub.planType),
      status: sub.status,
      createdAt: sub.createdAt,
      planType: sub.planType,
      stripeSessionId: sub.id,
      isUpdatedPlan: sub.isUpdatedPlan, // Add the new field here
    }));

    return NextResponse.json(paymentHistory);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getPlanAmount(planType: string): number {
  const planPrices: { [key: string]: number } = {
    SEVEN_DAYS: 129,
    FOURTEEN_DAYS: 299,
    ONE_MONTH: 499,
  };
  return planPrices[planType] || 0;
}
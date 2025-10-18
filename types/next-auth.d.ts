import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role: string;
    companyId: string | null;
    companyName?: string;
    onboardingCompleted: boolean;
    firstName?: string | null;
    lastName?: string | null;
    subscriptionStatus?: string | null;
    planType?: string | null;
    stripeCurrentPeriodEnd?: string | null;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      role: string;
      companyId: string | null;
      companyName?: string;
      onboardingCompleted: boolean;
      firstName?: string | null;
      lastName?: string | null;
      subscriptionStatus?: string | null;
      planType?: string | null;
      stripeCurrentPeriodEnd?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    companyId?: string | null;
    companyName?: string;
    onboardingCompleted?: boolean;
    firstName?: string | null;
    lastName?: string | null;
    subscriptionStatus?: string | null;
    planType?: string | null;
    stripeCurrentPeriodEnd?: string | null;
  }
}


import Brand from "@/components/landing/home/brand/brand";
import CustomerStories from "@/components/landing/home/customer-stories/customer-stories";
import Faq from "@/components/landing/home/faq/faq";
import HeroSection from "@/components/landing/home/hero/hero-section";
import Solutions from "@/components/landing/home/solution/solution";
import Subscription from "@/components/landing/subscription/subscription";
import { authOptions } from "@/lib/auth";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";


export const metadata: Metadata = {
    title: "Home | LeaveFlow",
};


export default async function Home() {
 const session = await getServerSession(authOptions);
  
  console.log("server session",session)
   if (session) {
    if (!session.user.onboardingCompleted) {
      redirect("/onboarding");
    } else if (session.user.role === "ADMIN") {
      redirect("/admin");
    } else if (session.user.role === "EMPLOYEE") {
      redirect("/employee");
    }
  }
  return (
   <main>
      <HeroSection />
        <Brand />
          {/* <CustomerStories /> */}
            {/* <Subscription /> */}
                 {/* <Faq /> */}
                  <Solutions />
   </main>
  );
}

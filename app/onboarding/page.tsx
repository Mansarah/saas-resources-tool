/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import OnboardingForm from "@/components/onboarding-form/onboarding-form";
import { useSession } from "next-auth/react";
import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";
export default function OnboardingPage() {
  const { data: session, status } = useSession();
  
  // console.log("session", session);
  // console.log("status", status);

if (session) {
  if (session.user.onboardingCompleted) {
    if (session.user.role === "ADMIN") {
      redirect("/admin");
    } else if (session.user.role === "EMPLOYEE") {
      redirect("/employee");
    } else {
      redirect("/"); // fallback if needed
    }
  }
}

  
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-3">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-3">
        <div className="max-w-sm w-full bg-card rounded-lg border border-border p-4 text-center">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-1">Access Required</h1>
          <p className="text-muted-foreground text-sm mb-3">You must be signed in to complete onboarding.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-primary text-primary-foreground py-2 px-3 rounded text-sm hover:bg-primary/90 transition-colors font-medium"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">LeaveFlow</h1>
            <p className="text-xs text-muted-foreground">Complete your setup</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Welcome</p>
          <p className="text-sm font-medium text-foreground">
            {session.user.name || session.user.email}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-foreground mb-1">Complete your profile</h1>
            <p className="text-sm text-muted-foreground">
              Join your team or create a new one
            </p>
          </div>
          
          <OnboardingForm
            userEmail={session.user.email || ""}
            firstName={(session.user as any).firstName || ""}
            lastName={(session.user as any).lastName || ""}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground">
            Need help? Contact{" "}
            <a href="mailto:support@leaveflow.com" className="text-primary hover:text-primary/80 font-medium">
              support@leaveflow.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
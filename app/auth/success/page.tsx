'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthSuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('Completing your login...');
  const [isCheckingCookies, setIsCheckingCookies] = useState(true);

  useEffect(() => {
    // Check if all required cookies are set
    const checkCookies = () => {
      const requiredCookies = [
        'user_id',
        'user_email',
        'user_role',
        'user_onboardingCompleted'
      ];
      
      const allCookiesSet = requiredCookies.every(cookie => {
        const value = document.cookie.includes(`${cookie}=`);
        return value;
      });
      
      return allCookiesSet;
    };

    if (status === 'authenticated' && session) {
      // If cookies are already set, proceed with navigation
      if (checkCookies()) {
        navigateToAppropriatePage();
        return;
      }

      // Otherwise, wait for cookies to be set
      setMessage('Setting up your account...');
      
      const interval = setInterval(() => {
        if (checkCookies()) {
          clearInterval(interval);
          setIsCheckingCookies(false);
          navigateToAppropriatePage();
        }
      }, 100);

      // Timeout after 5 seconds to prevent infinite waiting
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setIsCheckingCookies(false);
        navigateToAppropriatePage(); // Navigate even if cookies aren't set
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else if (status === 'unauthenticated') {
      // Redirect to signin if not authenticated
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  const navigateToAppropriatePage = () => {
    if (!session) return;
    
    const onboardingCompleted = session.user.onboardingCompleted;
    
    if (!onboardingCompleted) {
      router.push('/onboarding');
    } else {
      if (session.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/employee');
      }
    }
  };

  if (status === 'loading' || isCheckingCookies) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-4 text-gray-600">Finalizing your login...</p>
      </div>
    </div>
  );
}
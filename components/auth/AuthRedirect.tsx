/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Cookies from 'js-cookie';

const AuthRedirect = () => {
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchAndSetSessionCookies = async () => {
      try {
      
        if (session) {
          setSessionCookies(session);
        } else if (status === 'unauthenticated') {
        
          clearAuthCookies();
        } else {
       
          const response = await fetch('/api/auth/session');
          if (response.ok) {
            const sessionData = await response.json();
            setSessionCookies(sessionData);
          } else {
           
            clearAuthCookies();
          }
        }
      } catch (error) {
        console.error('Error setting session cookies:', error);
        clearAuthCookies();
      }
    };

    fetchAndSetSessionCookies();
  }, [session, status]);

  const setSessionCookies = (sessionData: any) => {
    const cookieOptions = {
      expires: 7, 
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    };

    
    
    if (sessionData.user) {
      Cookies.set('user_id', sessionData.user.id, cookieOptions);
      Cookies.set('user_name', sessionData.user.name, cookieOptions);
      Cookies.set('user_email', sessionData.user.email, cookieOptions);
      Cookies.set('user_image', sessionData.user.image, cookieOptions);
      Cookies.set('user_role', sessionData.user.role, cookieOptions);
      Cookies.set('user_companyId', sessionData.user.companyId || '', cookieOptions);
      Cookies.set('user_companyName', sessionData.user.companyName || '', cookieOptions);
      Cookies.set('user_onboardingCompleted', sessionData.user.onboardingCompleted.toString(), cookieOptions);
      Cookies.set('user_firstName', sessionData.user.firstName || '', cookieOptions);
      Cookies.set('user_lastName', sessionData.user.lastName || '', cookieOptions);
    }
  };

  const clearAuthCookies = () => {
    const authCookies = [
      'user_id', 'user_name', 
      'user_email', 'user_image', 'user_role', 'user_companyId',
      'user_companyName', 'user_onboardingCompleted', 'user_firstName',
      'user_lastName'
    ];
    
    authCookies.forEach(cookieName => {
      Cookies.remove(cookieName);
    });
  };

  
  return null;
};

export default AuthRedirect;
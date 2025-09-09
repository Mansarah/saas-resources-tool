// lib/cookieUtils.ts
import Cookies from 'js-cookie';



export const clearAuthCookies = () => {
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

export const isAuthenticated = (): boolean => {
  return !!Cookies.get('user_id');
};
// lib/cookieUtils.ts
import Cookies from 'js-cookie';

export const getAuthCookies = () => {
  return {
    authToken: Cookies.get('auth_token'),
    sessionExpires: Cookies.get('session_expires'),
    userId: Cookies.get('user_id'),
    userName: Cookies.get('user_name'),
    userEmail: Cookies.get('user_email'),
    userImage: Cookies.get('user_image'),
    userRole: Cookies.get('user_role'),
    userCompanyId: Cookies.get('user_companyId'),
    userCompanyName: Cookies.get('user_companyName'),
    userOnboardingCompleted: Cookies.get('user_onboardingCompleted') === 'true',
    userFirstName: Cookies.get('user_firstName'),
    userLastName: Cookies.get('user_lastName'),
  };
};

export const clearAuthCookies = () => {
  const authCookies = [
    'auth_token', 'session_expires', 'user_id', 'user_name', 
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
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
          
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // Fetch the complete user from database to get role and onboarding status
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { company: true },
        });
        
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.companyId = dbUser.companyId;
          token.companyName = dbUser.company?.name;
          token.onboardingCompleted = dbUser.onboardingCompleted;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
        }
      }
      
      // Update token with latest user data on subsequent requests
      if (!account && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          include: { company: true },
        });
        
        if (dbUser) {
          token.role = dbUser.role;
          token.companyId = dbUser.companyId;
          token.companyName = dbUser.company?.name;
          token.onboardingCompleted = dbUser.onboardingCompleted;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string | null;
        session.user.companyName = token.companyName as string | undefined;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
        session.user.firstName = token.firstName as string | null;
        session.user.lastName = token.lastName as string | null;
        
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { accounts: true, company: true },
          });

          if (existingUser) {
            // If user exists but doesn't have Google linked → link it
            const alreadyLinked = existingUser.accounts?.some(
              (acc: { provider: string; providerAccountId: string; }) => acc.provider === "google" && acc.providerAccountId === account.providerAccountId
            );

            if (!alreadyLinked) {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  token_type: account.token_type,
                  id_token: account.id_token,
                  scope: account.scope,
                  expires_at: account.expires_at,
                  refresh_token: account.refresh_token,
                },
              });
            }

            // Always update profile info
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name,
                image: user.image,
                firstName: existingUser.firstName || user.name?.split(' ')[0] || '',
                lastName: existingUser.lastName || user.name?.split(' ').slice(1).join(' ') || '',
              },
            });

            return true;
          } else {
            // No user → create new one with Google linked
            const names = user.name?.split(" ") || [];
            const firstName = names[0] || "";
            const lastName = names.slice(1).join(" ") || "";

            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                firstName,
                lastName,
                image: user.image,
                emailVerified: new Date(),
                onboardingCompleted: false,
                role: "EMPLOYEE", // Default role
                accounts: {
                  create: {
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    access_token: account.access_token, // Fixed typo: access_access_token → access_token
                    token_type: account.token_type,
                    id_token: account.id_token,
                    scope: account.scope,
                    expires_at: account.expires_at,
                    refresh_token: account.refresh_token,
                  },
                },
              },
            });

            return true;
          }
        } catch (error) {
          console.error("Error during Google sign in:", error);
          return false;
        }
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
     
       signOut: "/",
    error: "/auth/signin", 
    verifyRequest: "/auth/signin",
  },
};
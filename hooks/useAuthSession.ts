"use client"

import { useEffect, useState } from "react"
import { getSession } from "next-auth/react"

export type AuthUser = {
  id: string
  name: string
  email: string
  image?: string
  role: string
  companyId: string
  companyName: string
  onboardingCompleted: boolean
  firstName: string
  lastName: string
}

export type AuthSession = {
  user: AuthUser
  expires: string
}

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true)
      const data = (await getSession()) as AuthSession | null
      setSession(data)
      setLoading(false)
    }
    fetchSession()
  }, [])

  return { session, loading, isAuthenticated: !!session }
}

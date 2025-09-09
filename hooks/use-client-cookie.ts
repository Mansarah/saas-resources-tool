// hooks/useClientCookies.ts
import { useState, useEffect } from 'react'

export const useClientCookies = (cookieNames: string[]) => {
  const [values, setValues] = useState<Record<string, string>>({})
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const cookies = document.cookie.split(';')
    const newValues: Record<string, string> = {}
    
    cookieNames.forEach(cookieName => {
      const targetCookie = cookies.find(cookie => cookie.trim().startsWith(`${cookieName}=`))
      if (targetCookie) {
        const cookieValue = targetCookie.split('=')[1]
        newValues[cookieName] = decodeURIComponent(cookieValue)
      } else {
        newValues[cookieName] = ""
      }
    })
    
    setValues(newValues)
  }, [cookieNames.join(',')]) // Using join to create a stable dependency

  return { values, isClient }
}
// hooks/useClientCookie.ts
import { useState, useEffect } from 'react'

export const useClientCookie = (cookieName: string) => {
  const [value, setValue] = useState<string>("")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const cookies = document.cookie.split(';')
    const targetCookie = cookies.find(cookie => cookie.trim().startsWith(`${cookieName}=`))
    
    if (targetCookie) {
      const cookieValue = targetCookie.split('=')[1]
      setValue(decodeURIComponent(cookieValue))
    }
  }, [cookieName])

  return { value, isClient }
}
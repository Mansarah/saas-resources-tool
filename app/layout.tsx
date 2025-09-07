import { type Metadata } from 'next'

import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'LeaveFlow – Effortless Time Off Management',
  description:
    'LeaveFlow is a smart and modern HR tool that streamlines employee time off requests, approvals, and tracking—all in one place. Simplify leave management, reduce manual errors, improve transparency, and give your team a stress-free way to handle vacations, sick leaves, and work-from-home requests. Perfect for startups and growing companies that want to save time and boost productivity.',
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
             {/* <MaxWidthWrapper> */}
         
       
          {children}
          {/* </MaxWidthWrapper>  */}
        </body>
      </html>
   
  )
}
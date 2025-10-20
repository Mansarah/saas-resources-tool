
import Footer from '@/components/layout/footer/footer'
import Header from '@/components/layout/header'




export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
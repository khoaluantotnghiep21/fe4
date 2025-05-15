'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'

export default function PageWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isLoginStaffPage = pathname === '/management/login'
  if (isAuthPage || isLoginStaffPage) {
    return <div className="auth-container">{children}</div>
  }
  
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// import Header from '@/components/layout/Header';
// import Footer from '@/components/layout/Footer';
import useClientReady from '@/hooks/useClientReady';
import { UserProvider } from '@/context/UserContext';
import { LoadingProvider } from '../context/LoadingContext';

import { Spin } from 'antd';
import 'antd/dist/reset.css';
import { useEffect } from "react";

import PageWrapper from '@/components/layout/PageWrapper';


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useClientReady();
  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      localStorage.removeItem("user_information");
    }
  }, []);
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased flex flex-col min-h-screen">
        {!ready ? (
          <div className="w-full h-screen flex items-center justify-center bg-white">
            <Spin size="large" />
          </div>
        ) : (
          <LoadingProvider>
            <UserProvider>
              <PageWrapper>
                <main>{children}</main>
              </PageWrapper>
            </UserProvider>
          </LoadingProvider>
        )}
      </body>
    </html>
  );
}

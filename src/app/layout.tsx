'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import useClientReady from '@/hooks/useClientReady';

import { Spin } from 'antd';
import 'antd/dist/reset.css';
import {useEffect} from "react"; // reset mặc định của antd
import { AuthService } from '@/lib/auth/authService';



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
        const fetchData = async () => {
            try {
                const resp = await AuthService.detailEsurvey();
                console.log(resp); // xử lý dữ liệu ở đây
            } catch (error) {
                console.error('Lỗi khi gọi API:', error);
            }
        };

        fetchData();
    }, []);
  return (
      <html lang="vi" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased flex flex-col min-h-screen">
      {!ready ? (
          <div className="w-full h-screen flex items-center justify-center bg-white">
            <Spin size="large" />
          </div>
      ) : (
          <>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </>
      )}
      </body>
      </html>
  );
}

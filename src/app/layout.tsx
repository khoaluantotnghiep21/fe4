import PageWrapper from '@/components/layout/PageWrapper';
import { UserProvider } from '@/context/UserContext';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <UserProvider>
          <PageWrapper>{children}</PageWrapper>
        </UserProvider>
      </body>
    </html>
  );
}
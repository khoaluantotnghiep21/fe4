export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>; // No Header or Footer here
}
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <div className="auth-layout h-screen w-full overflow-y-auto md:overflow-hidden">
      {children}
    </div>
  );
}
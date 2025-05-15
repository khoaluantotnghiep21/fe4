export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout min-h-screen flex flex-col items-center justify-center bg-[#f4f6fb]">
      <div className="w-full max-w-md p-6 rounded-lg shadow-lg bg-white relative">
        {children}
      </div>
    </div>
  );
}
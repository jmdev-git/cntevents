import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "CNT CloudSpace",
  description:
    "Your Digital Workspace for faster, smarter, and safer collaboration.",
  icons: {
    icon: "/CloudSpace_Logo.png?v=2",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

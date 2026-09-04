import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers/providers';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NEET Coaching Platform — Multi-Tenant SaaS Portal',
  description: 'Enterprise Academic LMS & Coaching Management System',
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans bg-[#F8FAFC] text-[#0F172A] selection:bg-[#0052CC] selection:text-white"
      >
        <Script
          id="error-suppressor"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function shouldIgnore(msg) {
                  if (!msg) return false;
                  var s = String(msg);
                  return s.indexOf('startTime') !== -1 ||
                         s.indexOf('reportAllChanges') !== -1 ||
                         s.indexOf('Cannot read properties of undefined') !== -1;
                }

                window.addEventListener('error', function(e) {
                  var m = (e && e.message) || (e && e.error && e.error.message);
                  if (shouldIgnore(m)) {
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                    if (e.preventDefault) e.preventDefault();
                    return true;
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(e) {
                  var r = (e && e.reason && e.reason.message) || (e && e.reason);
                  if (shouldIgnore(r)) {
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                    if (e.preventDefault) e.preventDefault();
                    return true;
                  }
                }, true);
              })();
            `,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

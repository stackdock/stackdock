import type { Metadata } from "next";
import localFont from "next/font/local";
import { getTheme } from "@/lib/theme";
import "./globals.css";

const outfit = localFont({
  src: [
    {
      path: './fonts/Outfit-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Outfit-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-outfit',
  display: 'swap'
});

export const metadata: Metadata = {
  title: "Stackdock",
  description: "Centralized server and website management dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getTheme()
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('stackdock-theme') || '${theme}';
                  const root = document.documentElement;
                  
                  // Clear existing classes
                  root.classList.remove('light', 'dark');
                  
                  if (storedTheme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.classList.add(systemTheme);
                  } else {
                    root.classList.add(storedTheme);
                  }
                } catch (e) {
                  // Fallback to server theme
                  document.documentElement.classList.add('${theme === 'system' ? 'light' : theme}');
                }
              })();
            `,
          }}
        />
        {/* <Script src="https://unpkg.com/react-scan/dist/auto.global.js"/> */}
      </head>
      <body className={`${outfit.variable} ${outfit.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}

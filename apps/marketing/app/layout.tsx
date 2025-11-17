import type React from "react"
import type { Metadata } from "next"


import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL('https://stackdock.dev'),
  title: "StackDock - The First Open Source Multi-Cloud Management Platform",
  description: "Manage websites, applications, servers, databases, and APM tools across multiple cloud providers through their APIs. One interface. Less context switching. Open Source.",
  keywords: [
    "multi-cloud management",
    "open source",
    "cloud providers",
    "API management",
    "infrastructure as code",
    "cloud orchestration",
    "developer tools",
    "cloud automation"
  ],
  authors: [{ name: "StackDock Team" }],
  creator: "StackDock",
  publisher: "StackDock",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "StackDock - The First Open Source Multi-Cloud Management Platform",
    description: "Manage websites, applications, servers, databases, and APM tools across multiple cloud providers through their APIs. One interface. Less context switching. Open Source.",
    siteName: "StackDock",
    images: [
      {
        url: "/stackdock-favicon.png",
        width: 512,
        height: 512,
        alt: "StackDock - Multi-Cloud Management Platform",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StackDock - The First Open Source Multi-Cloud Management Platform",
    description: "Manage websites, applications, servers, databases, and APM tools across multiple cloud providers through their APIs. One interface. Less context switching. Open Source.",
    images: ["/stackdock-favicon.png"],
  },
  icons: {
    icon: '/stackdock-favicon.png',
    apple: '/stackdock-favicon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}

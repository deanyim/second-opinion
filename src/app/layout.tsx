import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Second Opinion - AI Assistance, Doubled",
  description: "Ask ChatGPT & Claude at the same time",
  openGraph: {
    title: "Second Opinion - AI Assistance, Doubled",
    description: "Ask ChatGPT & Claude at the same time",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Second Opinion - AI Assistance, Doubled",
    description: "Ask ChatGPT & Claude at the same time",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}

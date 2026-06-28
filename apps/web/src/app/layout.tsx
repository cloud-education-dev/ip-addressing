import './globals.css';
import React from 'react';

export const metadata = {
  title: 'IP Intelligence Platform - AWS VPC & CIDR Simulator',
  description: 'Enterprise IPAM, VLSM, Supernetting, and interactive AWS VPC packet-flow simulators for network engineers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}

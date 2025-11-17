import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Founder OS',
  description: 'Agent-native operating system for founders'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}



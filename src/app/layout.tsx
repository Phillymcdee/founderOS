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
        <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}



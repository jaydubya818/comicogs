import './globals.css'
import { AppShell } from '@/components/layout/AppShell'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = { 
  title: "Comicogs", 
  description: "Comics marketplace and collection management" 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}

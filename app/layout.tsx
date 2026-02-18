import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Komunitas Freelancer Indonesia — Temukan & Terhubung',
  description: 'Direktori freelancer Indonesia terpercaya. Temukan partner kerja terbaik atau daftarkan keahlian Anda untuk memperluas jaringan profesional.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={cn(jakarta.className, "min-h-screen bg-background font-sans antialiased")}>
        {/* Navigation */}
        <nav className="sticky top-0 z-40 w-full glass-card">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group min-h-0">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-primary text-white font-extrabold text-sm shadow-md">
                  FI
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold tracking-tight text-foreground leading-tight">
                    Freelancer
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground leading-tight -mt-0.5">
                    Indonesia
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  href="/directory"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted min-h-[40px]"
                >
                  Direktori
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-primary-foreground bg-gradient-primary rounded-lg shadow-sm hover:opacity-90 transition-all min-h-[40px]"
                >
                  Gabung
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 md:px-8 py-6 md:py-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t mt-12">
          <div className="container mx-auto px-4 md:px-8 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center text-white text-[9px] font-bold">FI</div>
                <span>Komunitas Freelancer Indonesia</span>
              </div>
              <p>Menghubungkan talenta terbaik Indonesia 🇮🇩</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppProviders } from "@/app/providers"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", geistMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <ThemeProvider>
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}

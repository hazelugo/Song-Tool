import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "sonner"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Repertoire",
  description: "Your repertoire. Built for flow.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 39px, oklch(1 0 0 / 0.025) 39px, oklch(1 0 0 / 0.025) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, oklch(1 0 0 / 0.025) 39px, oklch(1 0 0 / 0.025) 40px)",
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <main className="flex flex-col flex-1 min-h-0 overflow-y-auto p-6">
              <SidebarTrigger className="mb-4" />
              {children}
            </main>
          </SidebarProvider>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}

import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Viajes Cadete | Calculador de Viajes",
  description: "Planifica y gestiona tus rutas de manera eficiente",
    generator: 'v0.dev'
}

// Make sure the AuthProvider is properly initialized
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Aplicar tema oscuro inmediatamente si está guardado en localStorage
                const theme = localStorage.getItem('theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background">
        <AuthProvider>
          <ThemeProvider defaultTheme="light" attribute="class">
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}


import './globals.css'
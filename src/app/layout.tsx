import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

//const inter = Inter({ subsets: ['latin'] })

const poppins = Poppins({
  weight: '400',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Gerenciador de Campanhas de RPG',
  description: 'Uma aplicação para gerenciar suas campanhas de RPG',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin='anonymous'/>
      <link href="https://fonts.googleapis.com/css2?family=Boldonse&display=swap" rel="stylesheet"/>

      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,1,0" />
      </head>

      <body className={poppins.className}>
        {children}
      </body>
    </html>
  )
} 
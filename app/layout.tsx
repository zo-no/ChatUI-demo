import './globals.css'

export const metadata = {
  title: 'Chat UI',
  description: 'Simple Chat UI with typing bubble effect',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

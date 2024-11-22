import { Layout } from '@/components/dom/Layout'
import '@/global.css'

const title = 'Bobo & Strongman'
const url =  process.env.NODE_ENV ==="development" ? 'http://localhost:3000' : 'https://react-three-next.vercel.app'
const description = 'Beat on this clown toughguy'
const author = 'kernel-image'
const site = 'http://www.kernel-image.net'

/**
 * @type {import('next').Viewport}
 */
export const viewport = {
  themeColor: 'black',
}

/**
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: title,
  description: description,
  authors: [{ name: author, url: site }],
  publisher: author,
  keywords: 'Game',
  robots: 'index,follow',
  metadataBase: url,
  openGraph: {
    title: title,
    type: 'website',
    url: url,
    images: [{ url: '/icons/share.png', width: 800, height: 800 }],
    siteName: title,
    description: description,
  },
  twitter: {
    card: 'summary',
    site: site,
  },
  manifest: '/manifest.json',
  formatDetection: { email: true, telephone: true },
  icons: {
    icon: [{ url: '/icons/favicon.ico' }, { url: '/icons/favicon-32x32.png', type: 'image/png' }],
    shortcut: ['/icons/apple-touch-icon.png'],
    apple: [
      { url: '/icons/apple-touch-icon.png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [{ rel: 'mask-icon', url: '/icons/safari-pinned-tab.svg', color: '#000000' }],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang='en' className='antialiased'>
      <head />
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}
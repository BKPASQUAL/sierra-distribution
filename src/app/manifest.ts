import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sierra Distribution',
    short_name: 'Sierra',
    description: 'Efficient distribution management system',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/api/pwa-icon?w=192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/api/pwa-icon?w=512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}

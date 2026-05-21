import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,

  runtimeCaching: [
    {
      urlPattern:
        /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,

      handler: 'CacheFirst',

      options: {
        cacheName: 'google-fonts',

        expiration: {
          maxEntries: 4,
          maxAgeSeconds:
            365 * 24 * 60 * 60,
        },
      },
    },

    {
      urlPattern:
        /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,

      handler: 'CacheFirst',

      options: {
        cacheName:
          'static-font-assets',

        expiration: {
          maxEntries: 4,
          maxAgeSeconds:
            7 * 24 * 60 * 60,
        },
      },
    },

    {
      urlPattern:
        /\/rest\/v1\/flights.*/i,

      handler:
        'StaleWhileRevalidate',

      options: {
        cacheName:
          'flight-data-cache',

        expiration: {
          maxEntries: 32,
          maxAgeSeconds:
            24 * 60 * 60,
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
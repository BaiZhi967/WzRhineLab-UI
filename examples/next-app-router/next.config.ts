import type { NextConfig } from 'next';

/**
 * Inside the workspace the packages export their TypeScript source (`./src/index.ts`), whose
 * relative imports use `.js` specifiers (NodeNext style, emitted unchanged by tsc). Next must
 * compile that source (`transpilePackages`) and map `.js` → `.ts` / `.tsx` (`extensionAlias`).
 * Turbopack has no extensionAlias, so this example builds with webpack (`next build --webpack`).
 *
 * A consumer installing the published tarballs gets `dist/*.js` (with the `'use client'`
 * directives kept by tsc) and needs neither option (Turbopack with dist is not verified here).
 */
const nextConfig: NextConfig = {
  transpilePackages: ['@wzrhine/react', '@wzrhine/tokens'],
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    extensionAlias: { '.js': ['.ts', '.tsx', '.js'] },
  },
};

export default nextConfig;

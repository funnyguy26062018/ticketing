/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/ticketing',
  trailingSlash: true,
}

module.exports = nextConfig
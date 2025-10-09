/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    reactStrictMode: true, // Para una mejor detección de errores en desarrollo
    swcMinify: true, // Usar SWC para optimización
};

module.exports = nextConfig;

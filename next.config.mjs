/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NAVER_API_KEY: process.env.NAVER_API_KEY || '',
    NAVER_SECRET_KEY: process.env.NAVER_SECRET_KEY || '',
    NAVER_CUSTOMER_ID: process.env.NAVER_CUSTOMER_ID || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  },
};

export default nextConfig;
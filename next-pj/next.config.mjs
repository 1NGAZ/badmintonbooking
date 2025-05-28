/** @type {import('next').NextConfig} */
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

// อ่านไฟล์ customHeaders.yml
const customHeadersPath = path.join(process.cwd(), 'customHeaders.yml');
let customHeaders = {};

try {
  const fileContents = fs.readFileSync(customHeadersPath, 'utf8');
  customHeaders = yaml.load(fileContents);
} catch (error) {
  console.error('Error loading customHeaders.yml:', error);
}

const nextConfig = {
    reactStrictMode: false,
    output: 'export',
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
    // เพิ่ม headers configuration
    async headers() {
        // แปลงข้อมูลจาก customHeaders.yml เป็นรูปแบบที่ Next.js ต้องการ
        const headersConfig = [];
        
        if (customHeaders && customHeaders.customHeaders) {
            customHeaders.customHeaders.forEach(item => {
                headersConfig.push({
                    source: item.pattern.replace('**', '/:path*'),
                    headers: item.headers.map(header => ({
                        key: header.key,
                        value: header.value
                    }))
                });
            });
        }
        
        return headersConfig;
    },
};

export default nextConfig;
FROM node:20-alpine

# ติดตั้ง OpenSSL และ netcat
RUN apk add --no-cache openssl netcat-openbsd

WORKDIR /app

# คัดลอก package.json และ package-lock.json
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# คัดลอกไฟล์ทั้งหมด
COPY . .

# สร้าง Prisma Client
RUN npx prisma generate

# สร้างไฟล์สคริปต์แยกต่างหาก
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "Starting health check server..."' >> /app/entrypoint.sh && \
    echo '(while true; do { echo -e "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nOK"; } | nc -l -p 3000 -s 0.0.0.0; done) &' >> /app/entrypoint.sh && \
    echo 'HEALTH_PID=$!' >> /app/entrypoint.sh && \
    echo 'sleep 5' >> /app/entrypoint.sh && \
    echo 'echo "Health check server started"' >> /app/entrypoint.sh && \
    echo 'echo "Starting application..."' >> /app/entrypoint.sh && \
    echo 'node server.js' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# เปิด port 3000
EXPOSE 3000

# ใช้สคริปต์ entrypoint
CMD ["/app/entrypoint.sh"]
FROM node:20-alpine

# ติดตั้ง OpenSSL, netcat และ MySQL client
RUN apk add --no-cache openssl netcat-openbsd mysql-client

WORKDIR /app

# คัดลอก package.json และ package-lock.json
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# คัดลอกไฟล์ทั้งหมด
COPY . .

# สร้าง Prisma Client
RUN npx prisma generate

# สร้างไฟล์สคริปต์สำหรับเริ่มต้นแอปพลิเคชัน
RUN echo '#!/bin/sh' > /app/docker-entrypoint.sh && \
    echo 'echo "==== Environment Information ===="' >> /app/docker-entrypoint.sh && \
    echo 'echo "NODE_ENV: $NODE_ENV"' >> /app/docker-entrypoint.sh && \
    echo 'echo "DATABASE_URL: $(echo $DATABASE_URL | sed '"'"'s/:.*/:*****@/'"'"')"' >> /app/docker-entrypoint.sh && \
    echo 'echo "MYSQLHOST: $MYSQLHOST"' >> /app/docker-entrypoint.sh && \
    echo 'echo "MYSQLPORT: $MYSQLPORT"' >> /app/docker-entrypoint.sh && \
    echo 'echo "MYSQLDATABASE: $MYSQLDATABASE"' >> /app/docker-entrypoint.sh && \
    echo 'echo "MYSQLUSER: $MYSQLUSER"' >> /app/docker-entrypoint.sh && \
    echo 'echo "==============================="' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo '# แยกข้อมูลจาก DATABASE_URL' >> /app/docker-entrypoint.sh && \
    echo 'DB_HOST=$(echo $DATABASE_URL | sed -E '"'"'s/.*@([^:]+):.*/\1/'"'"')' >> /app/docker-entrypoint.sh && \
    echo 'DB_PORT=$(echo $DATABASE_URL | sed -E '"'"'s/.*:([0-9]+)\/.*/\1/'"'"')' >> /app/docker-entrypoint.sh && \
    echo 'DB_USER=$(echo $DATABASE_URL | sed -E '"'"'s/mysql:\/\/([^:]+).*/\1/'"'"')' >> /app/docker-entrypoint.sh && \
    echo 'DB_PASS=$(echo $DATABASE_URL | sed -E '"'"'s/mysql:\/\/[^:]+:([^@]+).*/\1/'"'"')' >> /app/docker-entrypoint.sh && \
    echo 'DB_NAME=$(echo $DATABASE_URL | sed -E '"'"'s/.*\/([^?]+).*/\1/'"'"')' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo 'echo "Extracted database connection info:"' >> /app/docker-entrypoint.sh && \
    echo 'echo "Host: $DB_HOST"' >> /app/docker-entrypoint.sh && \
    echo 'echo "Port: $DB_PORT"' >> /app/docker-entrypoint.sh && \
    echo 'echo "User: $DB_USER"' >> /app/docker-entrypoint.sh && \
    echo 'echo "Database: $DB_NAME"' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo '# เริ่ม health check server ก่อน' >> /app/docker-entrypoint.sh && \
    echo 'echo "Starting health check server on port 3000..."' >> /app/docker-entrypoint.sh && \
    echo '(while true; do { echo -e "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nOK"; } | nc -l -p 3000; done) &' >> /app/docker-entrypoint.sh && \
    echo 'HEALTH_PID=$!' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo '# รอสักครู่เพื่อให้ health check server เริ่มทำงาน' >> /app/docker-entrypoint.sh && \
    echo 'sleep 2' >> /app/docker-entrypoint.sh && \
    echo 'echo "Health check server started with PID $HEALTH_PID"' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo '# ทำ migration และเริ่มแอปพลิเคชัน' >> /app/docker-entrypoint.sh && \
    echo 'echo "Running Prisma migrations..."' >> /app/docker-entrypoint.sh && \
    echo 'npx prisma migrate deploy' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo 'echo "Starting main application..."' >> /app/docker-entrypoint.sh && \
    echo 'node server.js' >> /app/docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

# เปิด port 3000
EXPOSE 3000

# ตั้งค่าตัวแปรสภาพแวดล้อมให้ฟังบนทุก interface
ENV HOST=0.0.0.0

# ใช้สคริปต์ entrypoint
CMD ["/app/docker-entrypoint.sh"]
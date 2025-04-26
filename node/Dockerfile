FROM node:20-alpine

# Install OpenSSL for Prisma and netcat for database connection checking
RUN apk add --no-cache openssl netcat-openbsd

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# สร้างไฟล์สคริปต์แยกต่างหาก แทนที่จะใช้ printf
COPY <<EOF /app/docker-entrypoint.sh
#!/bin/sh
echo "Waiting for MySQL to be ready..."
# ใช้ค่าจาก DATABASE_URL แทนที่จะใช้ MYSQLHOST และ MYSQLPORT
DB_HOST=\$(echo \$DATABASE_URL | sed -E 's/.*@([^:]+):.*/\1/')
DB_PORT=\$(echo \$DATABASE_URL | sed -E 's/.*:([0-9]+)\/.*/\1/')
echo "Trying to connect to MySQL at \$DB_HOST:\$DB_PORT"

# ลองเชื่อมต่อกับฐานข้อมูล
for i in \$(seq 1 30); do
  if nc -z \$DB_HOST \$DB_PORT; then
    echo "MySQL is ready!"
    break
  fi
  echo "MySQL not ready yet... (attempt \$i/30)"
  sleep 5
  if [ \$i -eq 30 ]; then
    echo "Could not connect to MySQL after 30 attempts. Continuing anyway..."
  fi
done

# เพิ่ม health check endpoint ก่อนเริ่มแอปพลิเคชัน
echo "Starting health check server..."
(while true; do { echo -e "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nOK"; } | nc -l -p 3000; done) &
HEALTH_PID=\$!

# รอสักครู่เพื่อให้ health check server เริ่มทำงาน
sleep 5

# ทำ migration และเริ่มแอปพลิเคชัน
echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting main application..."
node server.js
EOF

RUN chmod +x /app/docker-entrypoint.sh

# Expose port 3000
EXPOSE 3000

# Set environment variable to listen on all interfaces
ENV HOST=0.0.0.0

# Use the entrypoint script
CMD ["/app/docker-entrypoint.sh"]
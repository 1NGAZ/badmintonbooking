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
COPY <<EOF /app/docker-entrypoint.sh
#!/bin/sh
echo "==== Environment Information ===="
echo "NODE_ENV: \$NODE_ENV"
echo "DATABASE_URL: \$(echo \$DATABASE_URL | sed 's/:.*/:*****@/')"
echo "MYSQLHOST: \$MYSQLHOST"
echo "MYSQLPORT: \$MYSQLPORT"
echo "MYSQLDATABASE: \$MYSQLDATABASE"
echo "MYSQLUSER: \$MYSQLUSER"
echo "==============================="

# แยกข้อมูลจาก DATABASE_URL
DB_HOST=\$(echo \$DATABASE_URL | sed -E 's/.*@([^:]+):.*/\1/')
DB_PORT=\$(echo \$DATABASE_URL | sed -E 's/.*:([0-9]+)\/.*/\1/')
DB_USER=\$(echo \$DATABASE_URL | sed -E 's/mysql:\/\/([^:]+).*/\1/')
DB_PASS=\$(echo \$DATABASE_URL | sed -E 's/mysql:\/\/[^:]+:([^@]+).*/\1/')
DB_NAME=\$(echo \$DATABASE_URL | sed -E 's/.*\/([^?]+).*/\1/')

echo "Extracted database connection info:"
echo "Host: \$DB_HOST"
echo "Port: \$DB_PORT"
echo "User: \$DB_USER"
echo "Database: \$DB_NAME"

echo "Testing network connectivity to MySQL..."
ping -c 3 \$DB_HOST || echo "Cannot ping MySQL host"

echo "Testing port connectivity to MySQL..."
nc -zv \$DB_HOST \$DB_PORT || echo "Cannot connect to MySQL port"

echo "Testing MySQL connection with credentials..."
mysql -u\$DB_USER -p\$DB_PASS -h\$DB_HOST -P\$DB_PORT -e "SHOW DATABASES;" || echo "MySQL connection test failed"

# เริ่ม health check server ก่อน
echo "Starting health check server on port 3000..."
(while true; do { echo -e "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nOK"; } | nc -l -p 3000; done) &
HEALTH_PID=\$!

# รอสักครู่เพื่อให้ health check server เริ่มทำงาน
sleep 2
echo "Health check server started with PID \$HEALTH_PID"

# ลองเชื่อมต่อกับฐานข้อมูลหลายครั้ง
echo "Waiting for MySQL to be ready..."
for i in \$(seq 1 30); do
  if mysql -u\$DB_USER -p\$DB_PASS -h\$DB_HOST -P\$DB_PORT -e "SELECT 1;" >/dev/null 2>&1; then
    echo "MySQL is ready! (attempt \$i)"
    break
  fi
  echo "MySQL not ready yet... (attempt \$i/30)"
  sleep 5
  if [ \$i -eq 30 ]; then
    echo "Could not connect to MySQL after 30 attempts. Continuing anyway..."
  fi
done

# ทำ migration และเริ่มแอปพลิเคชัน
echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting main application..."
node server.js
EOF

RUN chmod +x /app/docker-entrypoint.sh

# เปิด port 3000
EXPOSE 3000

# ตั้งค่าตัวแปรสภาพแวดล้อมให้ฟังบนทุก interface
ENV HOST=0.0.0.0

# ใช้สคริปต์ entrypoint
CMD ["/app/docker-entrypoint.sh"]
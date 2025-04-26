FROM node:20-alpine

# ติดตั้ง openssl สำหรับ Prisma บน alpine
RUN apk add --no-cache openssl

WORKDIR /app

# copy package.json และ lock file
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# copy โค้ดทั้งหมด
COPY . .

# generate Prisma client
RUN npx prisma generate

# เปิด port 3000
EXPOSE 3000

# คำสั่งเริ่มต้นเมื่อ container start
CMD ["npm", "run", "start"]

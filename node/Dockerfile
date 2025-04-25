# ตัวอย่าง Dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# กำหนดคำสั่งเริ่มต้น
CMD ["npm", "start"]

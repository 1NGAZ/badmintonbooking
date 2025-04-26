# Use Node.js on Alpine 3.17
FROM node:18-alpine3.17

# Set working directory
WORKDIR /app

# Copy only package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# ติดตั้ง openssl และ libssl-dev
# RUN apk add --no-cache openssl libssl-dev build-base
RUN apk add --no-cache libressl-dev build-base


# Copy the rest of the code
COPY . .

# Build Prisma client
RUN npx prisma generate

# Start the app
CMD ["npm", "run", "start"]

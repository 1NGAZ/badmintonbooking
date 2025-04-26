FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port 3000
EXPOSE 3000

# Set environment variable to listen on all interfaces
ENV HOST=0.0.0.0

# Start command with a delay to ensure MySQL is ready
CMD sh -c "sleep 10 && npx prisma migrate deploy && node server.js"
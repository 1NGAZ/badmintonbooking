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

# Create a script to wait for MySQL and then start the application
RUN echo '#!/bin/sh \n\
echo "Waiting for MySQL to be ready..." \n\
while ! nc -z $MYSQLHOST $MYSQLPORT; do \n\
  echo "MySQL not ready yet..." \n\
  sleep 2 \n\
done \n\
echo "MySQL is ready!" \n\
npx prisma migrate deploy \n\
node server.js' > /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Expose port 3000
EXPOSE 3000

# Set environment variable to listen on all interfaces
ENV HOST=0.0.0.0

# Use the entrypoint script
CMD ["/app/docker-entrypoint.sh"]
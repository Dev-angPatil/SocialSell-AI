# Use official Node.js runtime as parent image
FROM node:22-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (production only for lean image)
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose server port
EXPOSE 3001

# Start the server
CMD ["node", "index.js"]

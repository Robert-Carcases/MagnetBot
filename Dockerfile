# Use an official Node.js runtime as a base image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies including concurrently
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port if needed (e.g., for server.js running an API or web server)
# EXPOSE 3000

# Use concurrently to run both server.js and index.js
CMD ["npx", "concurrently", "node server.js", "node index.js"]

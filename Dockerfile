# Use Node.js image with your desired version
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy the rest of the application to the working directory
COPY . .

# Expose port 5000
EXPOSE 5000

# Start the Node.js app
CMD [ "sh", "-c", "npm start" ]
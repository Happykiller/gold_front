# Base image
FROM node:18-alpine AS build

# Create app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY --chown=node:node package*.json ./

# Install app dependencies using the `npm ci` command instead of `npm install`
RUN npm ci

# Bundle app source
COPY --chown=node:node . .

# Set NODE_ENV environment variable
ENV NODE_ENV=prod

# Build the application
RUN npm run build

# Start the server
FROM nginx:alpine

# Copy build artifacts
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy the public folder (or specific files you need)
COPY --from=build /usr/src/app/src/public /usr/share/nginx/html

# Copy nginx configuration
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

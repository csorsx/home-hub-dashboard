FROM node:20-alpine as builder

# Accept build arguments
ARG VITE_REMOOTIO_IP
ARG VITE_REMOOTIO_API_SECRET_KEY
ARG VITE_REMOOTIO_API_AUTH_KEY

# Set as environment variables for the build
ENV VITE_REMOOTIO_IP=$VITE_REMOOTIO_IP
ENV VITE_REMOOTIO_API_SECRET_KEY=$VITE_REMOOTIO_API_SECRET_KEY
ENV VITE_REMOOTIO_API_AUTH_KEY=$VITE_REMOOTIO_API_AUTH_KEY

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

# Production stage - Node.js server
FROM node:20-alpine

WORKDIR /app

# Install production dependencies for the server
RUN npm init -y && npm install express ws dotenv

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server ./server

# Default environment variables for runtime (can be overridden in Portainer)
ENV PORT=80
ENV REMOOTIO_IP=192.168.1.204
ENV REMOOTIO_PORT=8080

EXPOSE 80

CMD ["node", "server/index.js"]

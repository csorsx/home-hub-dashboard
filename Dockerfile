FROM node:20-alpine as builder

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

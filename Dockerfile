FROM node:20-alpine as builder

# Set as environment variables for the build
ENV VITE_REMOOTIO_IP=192.168.1.204
ENV VITE_REMOOTIO_API_SECRET_KEY=57F20297591737742AFF422CE68BF65DE640E48E547445C9B1423B6C8950D5A5
ENV VITE_REMOOTIO_API_AUTH_KEY=91DE3575142015A154D8749AF4B29B76FAB60513E44B973BD6076AF468A0BE90

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

# Production stage - Node.js server (not Nginx)
FROM node:20-alpine

WORKDIR /app

# Install production dependencies for the server
RUN npm init -y && npm install express ws

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server ./server

# Environment variables for runtime
ENV PORT=80
ENV REMOOTIO_IP=192.168.1.204
ENV REMOOTIO_PORT=8080

EXPOSE 80

CMD ["node", "server/index.js"]

FROM node:20-alpine as builder

# Set as environment variables for the build
ENV VITE_REMOOTIO_IP=192.168.1.204
ENV VITE_REMOOTIO_API_SECRET_KEY=239D49051C095FEB132788BFFC617F2993A40F22FB5F447533FFFF326650EAD8
ENV VITE_REMOOTIO_API_AUTH_KEY=163E4C625586E58F80259C8EB67072C4601204D12B79F18E101EF612B94D3795

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

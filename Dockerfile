# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package files first for better caching
COPY package.json package-lock.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine AS runner

WORKDIR /app

# Copy production config and install minimal dependencies
COPY package.json package-lock.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy only the necessary files for execution
COPY --from=builder /app/dist ./dist
COPY server ./server

# Runtime configuration
ENV NODE_ENV=production
ENV PORT=80
ENV REMOOTIO_IP=192.168.1.104
ENV REMOOTIO_PORT=887

EXPOSE 80

CMD ["node", "server/index.js"]

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

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

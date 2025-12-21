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

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

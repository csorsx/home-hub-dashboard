# Portainer Deployment Guide

Since you don't have Docker installed locally, the best way to deploy to your Portainer instance (192.168.1.102) is to let Portainer build the image directly from your Git repository.

## Prerequisites
1. Ensure the latest code (including `Dockerfile` and `docker-compose.yml`) is pushed to GitHub.
   - Run the workflow: **/push_to_git**

## Deployment Steps

## Standalone Container Deployment

If you prefer to run a single container instead of a stack, follow these steps:

### 1. Build the Image
1. Go to **Images** > **Build a new image**.
2. **Name**: `home-hub-dashboard:latest`.
3. Select **Build from specific URL** (GitHub icon).
   - **URL/Repository**: `https://github.com/csorsx/home-hub-dashboard.git`
   - **Dockerfile**: `Dockerfile` (default)
4. **Build Arguments** (click "Add build argument"):
   - `REMOOTIO_IP` = `192.168.1.104`
   - `REMOOTIO_PORT` = `887`
5. Click **Build the image**.

### 2. Create the Container
1. Go to **Containers** > **Add container**.
2. **Name**: `home-hub-dashboard`.
3. **Image**: `home-hub-dashboard:latest` (type the name exactly as you built it).
4. **Network ports configuration**:
   - Host: `8080`
   - Container: `80`
5. Click **Deploy the container**.

Your app will be available at `http://192.168.1.102:8080`.

## Alternative: Deploy as a Stack
If you change your mind and want to use Docker Compose:
1. Go to **Stacks** > **Add stack**.
2. Select **Repository**.
   - URL: `https://github.com/csorsx/home-hub-dashboard.git`
   - Compose path: `docker-compose.yml`
3. Click **Deploy the stack**.

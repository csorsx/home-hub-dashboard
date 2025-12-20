---
description: Build and publish the project to a local webserver (Port 8080)
---

1. Use npm to install dependencies
// turbo
npm install

2. Build the project for production
// turbo
npm run build

3. Serve the built project
# This command will start the web server on port 8080
# The --host flag makes it accessible to other devices on the network
npm run preview -- --port 8080 --host

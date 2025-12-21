#!/bin/sh

# Substitute environment variables in nginx.conf
envsubst '${REMOOTIO_IP}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx
exec nginx -g "daemon off;"

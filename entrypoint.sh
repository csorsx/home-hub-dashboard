#!/bin/sh

# Start Nginx (envsubst no longer needed)
exec nginx -g "daemon off;"

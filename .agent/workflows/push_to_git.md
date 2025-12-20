---
description: Prepare and push changes for Portainer deployment
---

1. Add Docker configuration files to git
// turbo
git add Dockerfile docker-compose.yml package-lock.json

2. Commit the changes
git commit -m "chore: add Docker configuration for Portainer deployment"

3. Push to the remote repository
git push origin main

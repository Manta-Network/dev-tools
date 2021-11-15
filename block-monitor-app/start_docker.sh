docker run -d -e DB_USER=postgres -e DB_PASSWORD=block-pass -e DB_HOST='block-watcher.czm86uay7xez.us-east-2.rds.amazonaws.com' -e NODE_ENV=production -d -p 5000:5000 --name appp node-app

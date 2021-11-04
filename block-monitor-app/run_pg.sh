#!/bin/bash
docker run --rm -d --name=block-data -p 5432:5432 -e POSTGRES_USER=block-data -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=blocks postgres

node create_tables.js

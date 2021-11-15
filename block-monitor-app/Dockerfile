FROM node:16 AS ui-build
WORKDIR /usr/src/app
COPY client/ ./client/
RUN cd client && npm install && npm run build

FROM node:16 AS server-build
WORKDIR /root/
COPY --from=ui-build /usr/src/app/client/build ./client/build
COPY ./package*.json ./
RUN npm install
COPY api/ ./api/

EXPOSE 5000

CMD ["node", "./api/server.js"]

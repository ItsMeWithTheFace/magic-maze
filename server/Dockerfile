FROM node:dubnium

WORKDIR /usr/src/app

COPY [ "package*.json", "app.js", "/usr/src/app/" ]
COPY "schema/" "/usr/src/app/schema/"
COPY "resolvers/" "/usr/src/app/resolvers/"
COPY "models/" "/usr/src/app/models/"
COPY "common/" "/usr/src/app/common/"

RUN npm install --only=production

EXPOSE 8000

CMD [ "npm", "start" ]

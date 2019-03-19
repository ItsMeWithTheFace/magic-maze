FROM node:dubnium

WORKDIR /usr/src/app

COPY [ ".env", "package*.json", "/usr/src/app/" ]
COPY "src/" "/usr/src/app/src/"
COPY "public/" "/usr/src/app/public/"

RUN npm install \
  && npm run build \
  && npm install -g serve

EXPOSE 5000

CMD [ "serve", "-s", "-l", "5000", "build" ]

FROM node:8 AS nodebuild

RUN node --version
RUN npm --version

COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

RUN cp config.js.example config.js

RUN npm start

EXPOSE 3000

CMD [ "npm", "start" ]


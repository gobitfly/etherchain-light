FROM node:8 AS nodebuild

RUN node --version
RUN npm --version

COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# config file already renamed to config.js
# RUN cp config.js.example config.js

EXPOSE 3000

CMD [ "npm", "start" ]

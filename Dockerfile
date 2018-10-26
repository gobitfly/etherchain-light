FROM node:8 AS nodebuild

RUN node --version
RUN npm --version

COPY package*.json ./

# Bundle app source
COPY . .

# unsafe-perm for the prepare step that copies libwabt.js
RUN npm config set unsafe-perm true && npm install

# config file already renamed to config.js
# RUN cp config.js.example config.js

EXPOSE 3000

# this command rpc arg is overwritten by the explorer yaml script
# CMD [ "npm", "start", "--", "--rpc=http://40.114.204.83:8545" ]
CMD [ "echo", "test" ]

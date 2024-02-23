FROM node:21-alpine

RUN apk add --update python3 make g++ && ln -sf python3 /usr/bin/python

RUN mkdir -p /bot
WORKDIR /bot

COPY .env /bot
COPY package.json /bot
COPY tsconfig.json /bot
COPY src/ /bot/src

RUN npm install
RUN npm run build
RUN npm run register-commands
RUN npm run script:add-items

ENV NODE_ENV=production
ENV REDIS_PORT=6379
ENV REDIS_HOST=cooldowns_db

CMD ["npm", "run", "start"]
FROM node:21-alpine

RUN mkdir -p /bot
WORKDIR /bot

COPY .env /bot
COPY package.json /bot
COPY src/ /bot/src

RUN npm install
RUN npm run build
RUN npm run register-commands
RUN npm run script:add-items

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
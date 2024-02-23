FROM node:21-alpine

RUN apk add --update python3 make g++ && ln -sf python3 /usr/bin/python

RUN mkdir -p /bot
WORKDIR /bot

COPY .env /bot
COPY package.json /bot
COPY pnpm-lock.yaml /bot
COPY tsconfig.json /bot
COPY tsconfig.eslint.json /bot
COPY src/ /bot/src

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm build
RUN pnpm run register-commands
RUN pnpm run script:add-items

ENV NODE_ENV=production
ENV REDIS_PORT=6379
ENV REDIS_HOST=cooldowns_db

CMD ["pnpm", "start"]
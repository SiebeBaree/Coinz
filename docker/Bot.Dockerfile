FROM node:latest

WORKDIR /usr/src/app

COPY ./apps/bot ./apps/bot
COPY ./apps/bot/.env.* ./apps/bot/.env.*
COPY ./packages ./packages
COPY ./package.json ./package.json
COPY ./turbo.json ./turbo.json
COPY ./bun.lockb ./bun.lockb
COPY ./tsconfig.json ./tsconfig.json

ENV TURBO_TELEMETRY_DISABLED=1
ENV DO_NOT_TRACK=1

RUN npm install -g bun@latest

RUN bun install

# ENV NODE_ENV=production

WORKDIR /usr/src/app/apps/bot
RUN bun --bun run register-commands
RUN bun --bun run script:add-items
WORKDIR /usr/src/app

ENTRYPOINT [ "bun", "--bun", "run", "start", "--filter", "bot" ]
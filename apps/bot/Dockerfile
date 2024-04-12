FROM oven/bun:latest

WORKDIR /usr/src/app

RUN mkdir -p ./src

COPY ./src ./src
COPY .env.* .
COPY package.json .

RUN bun install --production

ENV NODE_ENV=production

RUN bun --bun run register-commands
RUN bun --bun run script:add-items

ENTRYPOINT [ "bun", "--bun", "run", "./src/sharder.ts" ]
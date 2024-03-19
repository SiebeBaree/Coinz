FROM oven/bun:latest

WORKDIR /app

RUN mkdir -p ./src

COPY ./src ./src
COPY .env.* .
COPY package.json .
COPY bun.lockb .

RUN bun install --frozen-lockfile --production

ENV NODE_ENV=production

RUN bun --bun run register-commands
RUN bun --bun run script:add-items

# run the app
ENTRYPOINT [ "bun", "--bun", "run", "./src/sharder.ts" ]
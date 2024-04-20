FROM node:latest

WORKDIR /usr/src/app

COPY ./apps/api ./apps/api
COPY ./apps/api/.env ./apps/api/.env
COPY ./packages ./packages
COPY ./package.json ./package.json
COPY ./turbo.json ./turbo.json
COPY ./bun.lockb ./bun.lockb
COPY ./tsconfig.json ./tsconfig.json

ENV TURBO_TELEMETRY_DISABLED=1
ENV DO_NOT_TRACK=1

RUN npm install -g bun@latest

RUN bun install

ENV NODE_ENV=production
ENV PORT=3000

ENTRYPOINT [ "bun", "--bun", "run", "start", "--filter", "api" ]
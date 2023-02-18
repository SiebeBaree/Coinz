FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
COPY .env ./
COPY dist ./dist

# For production
# ENV NODE_ENV=production

RUN npm ci --emit=dev

CMD [ "npm", "run", "deploy" ]
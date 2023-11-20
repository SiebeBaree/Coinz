FROM node:20-alpine

RUN mkdir -p /app
WORKDIR /app

COPY .env /app
COPY package.json /app
COPY src/ /app/src

RUN npm install

CMD ["npm", "run", "start"]
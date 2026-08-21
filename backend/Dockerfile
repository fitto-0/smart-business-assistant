FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run init-db

EXPOSE 5000

CMD ["node", "server.js"]

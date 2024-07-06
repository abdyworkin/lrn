FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

# Скрипт ожидает когда указанный порт будет открыт
CMD ["npm", "run", "start:prod"]


FROM node:18-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
ENV CI=true
RUN npm run build

FROM node:18-alpine AS server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .

COPY --from=client /app/client/dist ../client/dist

EXPOSE 5000
CMD ["node", "server.js"]
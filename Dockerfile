FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server-dist ./server-dist
ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=3001
VOLUME /data
EXPOSE 3001
CMD ["node", "server-dist/index.js"]

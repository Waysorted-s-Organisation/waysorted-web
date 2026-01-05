FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --production
COPY . .
EXPOSE 3845
ENV PORT=3845
CMD ["node", "server.js"]

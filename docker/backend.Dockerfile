FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV LLM_PROVIDER=ollama
ENV OLLAMA_BASE_URL=http://host.docker.internal:11434

CMD ["npm", "start"]

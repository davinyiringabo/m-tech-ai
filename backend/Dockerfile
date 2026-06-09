# Backend: Express + TypeScript run via tsx (no separate build step needed).
FROM node:22-alpine

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package*.json ./
RUN npm install

# App source (schema.sql and data/ are needed at runtime for migrate/ingest).
COPY . .

EXPOSE 4000

# Apply migrations (idempotent), then start the server.
CMD ["sh", "-c", "npx tsx src/db/migrate.ts && npx tsx src/server.ts"]

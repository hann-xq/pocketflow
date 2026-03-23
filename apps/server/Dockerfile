# Base
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Dev (hot reload)
FROM base AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# Build
FROM base AS build
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Production
FROM node:22-alpine AS prod
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main"]

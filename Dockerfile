# Stage 1: Build
FROM docker.io/library/node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve
FROM docker.io/joseluisq/static-web-server:2-alpine

COPY sws.config.toml /config.toml
ENV SERVER_CONFIG_FILE=/config.toml
COPY --from=build /app/dist /public

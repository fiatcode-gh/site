# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve
FROM joseluisq/static-web-server:2-alpine

ENV SERVER_ROOT=/public
ENV SERVER_PORT=80

COPY --from=build /app/dist /public

# Stage 1: Build
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve
FROM joseluisq/static-web-server:2-alpine

COPY --from=build /app/dist /public

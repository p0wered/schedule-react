FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=5173 HOST=0.0.0.0
COPY package*.json ./
RUN npm ci --omit=dev && mkdir .cache && chown node:node .cache
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/lib/scheduleSnapshot.ts ./src/lib/scheduleSnapshot.ts
USER node
EXPOSE 5173
CMD ["npm", "start"]

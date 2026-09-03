# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Empty base URL => same-origin calls, resolved by nginx reverse proxy.
ENV VITE_API_BASE_URL=""
RUN npm run build

# ---- serve stage ----
FROM nginx:1.27-alpine AS serve
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/loom.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

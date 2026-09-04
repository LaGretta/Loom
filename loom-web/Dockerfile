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
# The base image entrypoint renders /etc/nginx/templates/*.template with envsubst at
# container start, substituting ${PORT} and ${API_URL}. Output default.conf overwrites
# the stock welcome site (so no port-80 conflict).
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
# Defaults for local runs; Railway injects PORT (auto) and you set API_URL.
ENV PORT=80
ENV API_URL=http://api:8080
EXPOSE 80
# Keep the base image ENTRYPOINT (/docker-entrypoint.sh runs envsubst, then execs CMD).
CMD ["nginx", "-g", "daemon off;"]

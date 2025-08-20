# ----- Build stage -----
FROM node:20-alpine AS build
LABEL authors="pracht"

WORKDIR /app

# Install deps first for better caching
COPY package.json package-lock.json*  ./

RUN npm ci || npm install

# Copy source and build
COPY . .
# For Vite: npm run build
RUN npm run build

# ----- Runtime stage (Nginx) -----
FROM nginx:1.27-alpine
# Remove default site
RUN rm -f /etc/nginx/conf.d/default.conf
# Add our config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy the compiled frontend to Nginx html
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

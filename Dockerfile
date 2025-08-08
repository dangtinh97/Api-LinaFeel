FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .

# Expose the application port
EXPOSE 3000
RUN pnpm build
# Start the application
CMD ["pnpm", "start"]

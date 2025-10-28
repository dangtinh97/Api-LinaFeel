# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Tăng giới hạn bộ nhớ để tránh lỗi heap out of memory khi build
ENV NODE_OPTIONS="--max-old-space-size=6144"

# Cài pnpm
RUN npm install -g pnpm

# Copy file cấu hình trước để cache install dependencies
COPY package.json pnpm-lock.yaml tsconfig.json tsconfig.build.json nest-cli.json ./

# Cài dependencies (chỉ cần dependencies phục vụ build)
RUN pnpm install --frozen-lockfile

# Copy toàn bộ source code
COPY . .

# Build project
RUN pnpm build


# ---------- Stage 2: Runtime ----------
FROM node:20-alpine AS runner

WORKDIR /app

# Cài lại pnpm (tùy, có thể bỏ nếu bạn start bằng node)
#RUN npm install -g pnpm

# Copy file cần thiết từ build stage
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/tsconfig.json /app/tsconfig.build.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/views ./views
# Expose cổng ứng dụng
EXPOSE 3000

# Biến môi trường runtime
ENV NODE_ENV=production

# Lệnh chạy app
CMD ["node", "dist/main.js"]

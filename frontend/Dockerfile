# Этап сборки
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая dev)
RUN npm install

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Продакшен этап (остаётся без изменений)
FROM node:18-alpine AS production
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
RUN addgroup -g 1001 -S nodejs && adduser -S app -u 1001 -G nodejs
RUN chown -R app:nodejs /app
USER app
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
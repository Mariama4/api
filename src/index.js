// index.js
// This is the main entry point of our application
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const models = require('./models');
const db = require('./db');

// Запускаем сервер на порте, указанном в файле .env, или на порте 4000
const port = process.env.PORT || 4000;
// Сохраняем значение DB_HOST в виде переменной
const DB_HOST = process.env.DB_HOST;

const app = express();
// app.use(require('express-status-monitor')());
// Подключаем БД
db.connect(DB_HOST);

// Получаем информацию пользователя из jwt
const getUser = token => {
  if (token) {
    try {
      // возвращает информацию пользователя из токена
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Session invalid');
    }
  }
};

// Настройка Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Получаем токен пользователя из заголовка
    const token = req.headers.authorization;
    // Пытаемся извлечь извлечь пользователя с помощью токена
    const user = getUser(token);
    // Пока что будем выводить информацию о пользователе в консоль
    console.log(user);

    // Добавление моделей БД в context
    return { models, user };
  }
});

// Применяем промежуточное ПО Apollo GraphQL и указываем путь к /api
server.applyMiddleware({ app, path: '/api' });

app.listen({ port }, () =>
  console.log(
    `GraphQL Server running at http://localhost:${port}${server.graphqlPath}`
  )
);

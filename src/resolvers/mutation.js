const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
  AuthenticationError,
  ForbiddenError
} = require('apollo-server-express');
require('dotenv').config();

const gravatar = require('../util/gravatar');

module.exports = {
  newNote: async (parent, args, { models }) => {
    return await models.Note.create({
      content: args.content,
      author: 'Adam Scott'
    });
  },
  deleteNote: async (parent, { id }, { models }) => {
    try {
      await models.Note.findOneAndRemove({ _id: id });
      return true;
    } catch (error) {
      return false;
    }
  },
  updateNote: async (parent, { id, content }, { models }) => {
    return await models.Note.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          content
        }
      },
      { new: true }
    );
  },
  signUp: async (parent, { username, email, password }, { models }) => {
    // нормализация email
    email = email.trim().toLowerCase();
    // хёшируем пароль
    const hashed = await bcrypt.hash(password, 10);
    // создаем url-gravatar-изображения
    const avatar = gravatar(email);
    try {
      const user = await models.User.create({
        username,
        email,
        avatar,
        password: hashed
      });
      // созадем и возвращаем jwt
      return jwt.sign(
        {
          id: user._id
        },
        process.env.JWT_SECRET
      );
    } catch (err) {
      console.log(err);
      throw new Error('Error creating account');
    }
  },
  signIn: async (parent, { username, email, password }, { models }) => {
    // нормализация email при наличии
    if (email) {
      email = email.trim().toLowerCase();
    }

    const user = await models.User.findOne({
      $or: [{ email }, { username }]
    });

    // если пользователь не найден, выбрасываем ошибку аутентификации
    if (!user) {
      throw new AuthenticationError('Error signing in');
    }

    // если пароли не совпадают, выбрасываем ошибку аутентификации
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new AuthenticationError('Error signing in');
    }

    // создаем и возвращаем токен jwt
    return jwt.sign(
      {
        id: user._id
      },
      process.env.JWT_SECRET
    );
  }
};

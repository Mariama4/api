const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const {
  AuthenticationError,
  ForbiddenError
} = require('apollo-server-express');
require('dotenv').config();

const gravatar = require('../util/gravatar');

module.exports = {
  newNote: async (parent, args, { models, user }) => {
    // Если в контексте нет пользователя, выбрасываем AuthenticationError
    if (!user) {
      throw new AuthenticationError('You must be signed in to create a note');
    }
    return await models.Note.create({
      content: args.content,
      // Ссылаемся на mongo id автора
      author: user.id
    });
  },
  deleteNote: async (parent, { id }, { models, user }) => {
    // Если в контексте нет пользователя, выбрасываем AuthenticationError
    if (!user) {
      throw new AuthenticationError('You must be signed in to delete a note');
    }

    // Находим заметку
    const note = await models.Note.findById(id);

    // Если владецлец заметки и текущий пользователь не совпадают, то выбразываем запрет на действие
    if (note && String(note.author) !== user.id) {
      throw new ForbiddenError('You don`t have permission to delete the note');
    }

    try {
      // Если все проверки проходят, удаляем заметку
      await note.remove();
      return true;
    } catch (err) {
      // если в процессе возникает ошибка, возвращаем false
      return false;
    }
  },
  updateNote: async (parent, { id, content }, { models, user }) => {
    // Если в контексте нет пользователя, выбрасываем AuthenticationError
    if (!user) {
      throw new AuthenticationError('You must be signed in to update a note');
    }

    // Находим заметку
    const note = await models.Note.findById(id);
    // Если владецлец заметки и текущий пользователь не совпадают, то выбразываем запрет на действие
    if (note && String(note.author) !== user.id) {
      throw new ForbiddenError('You don`t have permission to update the note');
    }

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
  },
  toggleFavorite: async (parent, { id }, { models, user }) => {
    // если пользователь не найден, выбрасываем ошибку аутентификации
    if (!user) {
      throw new AuthenticationError('Error signing in');
    }
    // Проверяем на валидный id
    if (!mongoose.isValidObjectId(id)) {
      throw new ForbiddenError('Incorrect id');
    }
    // проверяем отмечал ли пользователь заметку как избранную
    let noteCheck = await models.Note.findById(id);
    const hasUser = noteCheck.favoritedBy.indexOf(user.id);
    // если пользователь есть в списке, удаляем его оттуда и уменьшаем значение
    // favoriteCount на 1
    if (hasUser >= 0) {
      console.log(-1);
      return await models.Note.findOneAndUpdate(
        { _id: id },
        {
          $pull: {
            favoritedBy: mongoose.Types.ObjectId(user.id)
          },
          $inc: {
            favoriteCount: -1
          }
        },
        {
          // устанавливаем new как true, чтобы вернуть обновленный документ
          new: true
        }
      );
    } else {
      // если пользователя в списке нет, то добавляем его туда и увеличиваем
      // значение favoriteCount на 1
      console.log(+1);
      return await models.Note.findOneAndUpdate(
        { _id: id },
        {
          $push: {
            favoritedBy: mongoose.Types.ObjectId(user.id)
          },
          $inc: {
            favoriteCount: 1
          }
        },
        {
          // устанавливаем new как true, чтобы вернуть обновленный документ
          new: true
        }
      );
    }
  }
};

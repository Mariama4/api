module.exports = {
  notes: async (parent, args, { models }) => {
    return await models.Note.find();
  },
  note: async (parent, args, { models }) => {
    return await models.Note.findById(args.id);
  },
  user: async (paren, { username }, { models }) => {
    // находим пользователя по имени
    return await models.User.findOne({ username });
  },
  users: async (paren, args, { models }) => {
    // находим всех пользователей
    return await models.User.find({});
  },
  me: async (paren, args, { models, user }) => {
    // находим пользователя по текущему пользовательскому контексту
    return await models.User.findById(user.id);
  }
};

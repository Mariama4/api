module.exports = {
  // При запросе разрешается информация об авторе заметки
  author: async (note, args, { models }) => {
    return await models.User.findById(note.author);
  },
  // При запросе разрешается информация favoriteBy для заметки
  favoriteBy: async (note, args, { models }) => {
    return await models.User.find({
      _id: {
        $in: note.favoriteBy
      }
    });
  }
};

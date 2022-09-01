const { gql } = require('apollo-server-express');

// Построение схемы с использованием языка схем GraphQL
module.exports = gql`
  scalar DateTime

  type Query {
    notes: [Note!]
    note(id: ID!): Note!
    user(username: String!): User
    users: [User!]!
    me: User!
  }

  type Note {
    id: ID!
    content: String!
    author: User!
    favoriteCount: Int!
    favoritedBy: [User!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type User {
    id: ID!
    username: String!
    email: String!
    avatar: String
    notes: [Note!]!
    favorites: [Note!]!
  }

  type Mutation {
    newNote(content: String!): Note!
    updateNote(id: ID!, content: String!): Note!
    deleteNote(id: ID!): Boolean!
    signUp(username: String!, email: String!, password: String!): String!
    signIn(username: String, email: String, password: String!): String!
    # Передаем id заметки
    toggleFavorite(id: ID!): Note!
  }
`;

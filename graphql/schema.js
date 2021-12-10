const { buildSchema } = require('graphql')

module.exports = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type AuthData {
        userId: String!
        token: String!
    }

    type User {
        _id: ID!
        name: String!
        email: String!
        password: String!
        posts: [Post!]!
    }

    type PostData {
        posts: [Post!]!
        totalItems: Int!
    }

    type UserStatus {
        status: String!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }

    input PostInputData {
        title: String!
        content: String!
        imageUrl: String!
    }

    type RootQuery {
        login(email: String!, password: String!): AuthData!
        getPosts(page: Int): PostData!
        getPost(postId: String!): Post!
        getStatus: UserStatus!
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
        createPost(postInput: PostInputData): Post!
        updatePost(_id: ID!, postInput: PostInputData): Post!
        deletePost(_id: ID!): Boolean!
        updateStatus(newStatus: String!): UserStatus!
    }
    schema {
        query: RootQuery
        mutation: RootMutation
    }
`)
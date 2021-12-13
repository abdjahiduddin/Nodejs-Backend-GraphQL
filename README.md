# Nodejs Backend - GraphQL
Project ini dibangun pada saat mengikuti online course dari Udemy </br>
https://www.udemy.com/course/nodejs-the-complete-guide/

## Web Stack

- Node.js
- Express
- MongoDB Atlas

## Live Preview

Frontend yang menggunakan backend ini telah di deploy ke [github pages](https://pages.github.com/) dan dapat diakses melalui link berikut <br/>
https://abdjahiduddin.github.io/frontend-nodejs-graphql/ <br/>
Sedangkan backend ini telah dideploy di [heroku](https://www.heroku.com/) <br/>
https://message-graphql.herokuapp.com/graphql

Anda dapat membuat akun baru atau login menggunakan user berikut<br/>
user: john.doe@test.com <br/>
pass: 123456

## Fitur

- Login dan Signup
- Proses authentikasi menggunakan JWT
- Menampilkan daftar feed
- Menampilkan detail dari sebuah feed
- User dapat menambahkan, menghapus, dan mengubah sebuah feed

## GraphQL

#### Membuat user baru

```javascript
Endpoint : /graphql
Method   : POST
graphqlQuery = {
    query: `
        mutation CreateNewUser ($email: String!, $name: String!, $password: String!) {
            createUser(userInput: {email: $email, name: $name, password: $password}) {
            _id
            name
            email
            }
        }
    `,
    variables: {
        email: email,
        password: password,
        name: name
    }
}
```

#### Login

```javascript
Endpoint : /graphql
Method   : POST
graphqlQuery = {
    query: `
        query Login ($email: String!, $password: String!){
            login(email: $email, password: $password) {
            userId
            token
            }
        }
    `,
    variables: {
        email: email,
        password: password
    }
}
```

#### Request status user

```javascript
Endpoint : /graphql
Method   : POST
graphqlQuery = {
    query: `
        query FetchStatus {
            getStatus {
            status
            }
        }
    `,
}
```

#### Mengubah status user

```javascript
Endpoint : /graphql
Method   : POST
graphqlQuery = {
    query: `
        mutation UserStatusUpdate ($status: String!) {
            updateStatus(newStatus: $status) {
            status
            }
        }
    `,
    variables: {
        status: "New Status",
    },
}
```

#### Request seluruh feeds

```javascript
Endpoint : /graphql
Method   : POST
graphqlQuery = {
      query: `
        query FetchPost ($page: Int){
            getPosts(page: $page){
            posts {
                _id
                creator {
                name
                }
                title
                content
                createdAt
                imageUrl
            }
            totalItems
            }
        }
    `,
    variables: {
        page: page,
    },
}
```

#### Membuat feed baru

```javascript
Endpoint : /graphql
Method   : POST
graphqlQuery = {
    query: `
        mutation CreateNewPost ($title: String!, $content: String!, $imageUrl: String! ) {
            createPost(postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
            _id
            title
            content
            imageUrl
            creator {
                name
            }
            createdAt
            }
        }
    `,
    variables: {
        title: title,
        content: content,
        imageUrl: image,
    },
}
```

#### Menampilkan detail feed tertentu

```javascript
Endpoint : /graphql
Method   : POST
graphqlQuery = {
    query: `
        query FetchPost ($postId: String!){
            getPost(postId: $postId){
            _id
            title
            content
            imageUrl
            creator {
                name
                _id
            }
            createdAt
            }
        }
    `,
    variables: {
        postId: postId
    }
}
```

#### Mengedit feed tertentu

```javascript
Endpoint : /graphql
Method   : POST
graphqlQuery = {
    query: `
        mutation UpdatePost ($postId: ID!, $title: String!, $content: String!, $imageUrl: String!) {
            updatePost(_id: $postId, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
                _id
                title
                content
                imageUrl
                creator {
                name
                }
                createdAt
            }
        }
    `,
    variables: {
        postId: postId,
        title: title,
        content: content,
        imageUrl: image,
    },
}
```

#### Menghapus feed tertentu

```javascript
Endpoint : /graphql
Method   : POST
graphqlQuery = {
    query: `
        mutation DeletePost ($postId: ID!) {
            deletePost(_id: $postId) 
        }
    `,
    variables: {
        postId: postId,
    },
}
```

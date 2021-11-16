const express = require("express");
const { body } = require("express-validator");

// Import Controllers
const feedController = require("../controllers/feed");

// Import verification middleware
const isAuth = require("../middleware/is-auth");

const routes = express.Router();

routes.get("/posts", isAuth, feedController.getPosts);
routes.post(
  "/post",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.createPost
);

routes.get("/post/:postId", isAuth, feedController.getPost);

routes.put(
  "/post/:postId",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.updatePost
);

routes.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = routes;
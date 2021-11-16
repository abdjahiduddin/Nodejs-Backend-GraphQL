const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/auth");

const isAuth = require("../middleware/is-auth");

const User = require("../models/auth");

const routes = express.Router();

routes.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter valid email")
      .trim()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((result) => {
          if (result) {
            return Promise.reject("Email already exists");
          }
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
    body("name").trim().not().isEmpty(),
  ],
  authController.signup
);

routes.post("/login", authController.login);

routes
  .route("/status")
  .get(isAuth, authController.getStatus)
  .put(
    [ body("status").trim().not().isEmpty() ],
    isAuth,
    authController.updateStatus
  );

module.exports = routes;

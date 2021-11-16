const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const User = require("../models/auth");

exports.signup = async (req, res, next) => {
  const error = validationResult(req);
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;

  if (!error.isEmpty()) {
    const err = new Error("Validation failed");
    err.statusCode = 422;
    err.data = error.array();
    throw err;
  }

  try {
    const hashPassword = await bcrypt.hash(password, 12);

    const user = new User({
      email: email,
      password: hashPassword,
      name: name,
    });

    const result = await user.save();

    res.status(200).json({
      message: "User created",
      data: result._id,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const error = validationResult(req);
  const email = req.body.email;
  const password = req.body.password;

  if (!error.isEmpty()) {
    const err = new Error("Validation failed");
    err.statusCode = 422;
    err.data = error.array();
    throw err;
  }

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("Invalid email");
      error.statusCode = 401;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Invalid password");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      { email: user.email, userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token: token,
      userId: user._id.toString(),
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getStatus = async (req, res, next) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({
      status: user.status,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  const error = validationResult(req);
  const userId = req.userId;
  const status = req.body.status;

  if (!error.isEmpty()) {
    const err = new Error("Status validation failed");
    err.statusCode = 422;
    err.data = error.array();
    throw err;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    user.status = status;
    const result = await user.save();
    
    res.status(200).json({
      message: "Status updated",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

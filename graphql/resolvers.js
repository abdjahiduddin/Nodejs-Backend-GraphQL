const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const val = require("validator");

dotenv.config();
const validator = val.default;

const User = require("../models/auth");
const Post = require("../models/post");

module.exports = {
  // Another way
  // createUser(args, req) {
  //     const email = args.userInput.email
  // }

  createUser: async function ({ userInput }, req) {
    const email = userInput.email;
    const name = userInput.name;
    const password = userInput.password;

    const validationErrors = [];
    if (!validator.isEmail(email)) {
      validationErrors.push({ message: "Email is invalid" });
    }

    if (validator.isEmpty(name)) {
      validationErrors.push({ message: "Name is invalid" });
    }

    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    ) {
      validationErrors.push({ message: "Password empty or too short" });
    }

    if (validationErrors.length > 0) {
      const err = new Error("Validation failed");
      err.code = 422;
      err.data = validationErrors;
      throw err;
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      const error = new Error("User already exists");
      throw error;
    }

    const hashPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      email: email,
      name: name,
      password: hashPassword,
    });

    const savedUser = await newUser.save();
    const userId = savedUser._id.toString();

    const userPath = path.join(__dirname, "..", "images", userId);

    if (!fs.existsSync(userPath)) {
      fs.mkdir(userPath, (err) => {
        if (err) console.log(err);
      });
    }

    return { ...savedUser._doc, _id: savedUser._id.toString() };
  },

  login: async function ({ email, password }) {
    const fetchedUser = await User.findOne({ email: email });
    if (!fetchedUser) {
      const err = new Error("Invalid email or password");
      err.code = 401;
      throw err;
    }

    const isEqual = await bcrypt.compare(password, fetchedUser.password);
    if (!isEqual) {
      const err = new Error("Invalid email or password.");
      err.code = 401;
      throw err;
    }

    const token = jwt.sign(
      {
        userId: fetchedUser._id.toString(),
        email: email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      userId: fetchedUser._id.toString(),
      token: token,
    };
  },

  getPosts: async function ({ page }, req) {
    if (!req.isAuth) {
      const err = new Error("Not authenticated");
      err.code = 401;
      throw err;
    }

    const currentPage = page || 1;
    const itemsPerPage = 2;

    const totalItems = await Post.find().countDocuments();

    const posts = await Post.find()
      .populate("creator")
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .sort({ createdAt: -1 });

    const mapPosts = posts.map((item) => {
      return {
        ...item._doc,
        _id: item._id.toString(),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });

    return {
      posts: mapPosts,
      totalItems: totalItems,
    };
  },

  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const err = new Error("Not authenticated");
      err.code = 401;
      throw err;
    }

    const validationErrors = [];

    const title = postInput.title;
    const content = postInput.content;
    const imageUrl = postInput.imageUrl;

    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      validationErrors.push({ message: "Title is invalid" });
    }

    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      validationErrors.push({ message: "Content is invalid" });
    }

    if (validationErrors.length > 0) {
      const err = new Error("Validation failed");
      err.code = 422;
      err.data = validationErrors;
      throw err;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const err = new Error("Invalid user");
      err.code = 401;
      throw err;
    }

    const post = new Post({
      title: title,
      imageUrl: imageUrl,
      content: content,
      creator: user,
    });

    const savedPost = await post.save();

    user.posts.push(savedPost);
    await user.save();

    return {
      ...savedPost._doc,
      _id: savedPost._id.toString(),
      createdAt: savedPost.createdAt.toISOString(),
      updatedAt: savedPost.updatedAt.toISOString(),
    };
  },

  getPost: async function ({ postId }, req) {
    if (!req.isAuth) {
      const err = new Error("Not authenticated");
      err.code = 401;
      throw err;
    }

    const post = await Post.findById(postId).populate("creator");

    if (!post) {
      const err = new Error("Post not found");
      err.code = 404;
      throw err;
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },

  updatePost: async function ({ _id, postInput }, req) {
    if (!req.isAuth) {
      const err = new Error("Not authenticated");
      err.code = 401;
      throw err;
    }

    const validationErrors = [];

    const title = postInput.title;
    const content = postInput.content;
    const imageUrl = postInput.imageUrl;

    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      validationErrors.push({ message: "Title is invalid" });
    }

    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      validationErrors.push({ message: "Content is invalid" });
    }

    if (validationErrors.length > 0) {
      const err = new Error("Validation failed");
      err.code = 422;
      err.data = validationErrors;
      throw err;
    }

    const post = await Post.findById(_id).populate("creator");
    if (!post) {
      const err = new Error("Post not found");
      err.code = 404;
      throw err;
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const err = new Error("Not authorized for editing");
      err.code = 403;
      throw err;
    }

    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;

    const updatedPost = await post.save();

    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
  },

  deletePost: async function ({ _id }, req) {
    if (!req.isAuth) {
      const err = new Error("Not authenticated");
      err.code = 401;
      throw err;
    }
    const prodId = _id;

    const post = await Post.findById(prodId);
    if (!post) {
      const err = new Error("Post not found");
      err.code = 404;
      throw err;
    }

    if (post.creator.toString() !== req.userId.toString()) {
      const err = new Error("Not authorized for deleting");
      err.code = 403;
      throw err;
    }

    const user = await User.findById(post.creator._id);
    user.posts.pull(prodId);
    await user.save();

    const imagePath = path.join(__dirname, "..", post.imageUrl);
    fs.unlink(imagePath, (err) => {
      if (err) console.log(err);
    });

    await Post.findByIdAndDelete(prodId);

    return true
  },

  getStatus: async function (args ,req) {
    if (!req.isAuth) {
      const err = new Error("Not authenticated");
      err.code = 401;
      throw err;
    }
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.code = 404;
      throw err;
    }

    const status = user.status;

    return {
      status: status,
    };
  },

  updateStatus: async function ({ newStatus }, req) {
    if (!req.isAuth) {
      const err = new Error("Not authenticated");
      err.code = 401;
      throw err;
    }

    const validationErrors = [];

    if (validator.isEmpty(newStatus)) {
      validationErrors.push({ message: "Status is empty" });
    }

    if (validationErrors.length > 0) {
      const err = new Error("Validation failed");
      err.code = 422;
      err.data = validationErrors;
      throw err;
    }

    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.code = 404;
      throw err;
    }

    const status = validator.trim(newStatus)

    user.status = status;
    const savedStatus = await user.save();

    return {
      status: savedStatus.status,
    };
  },
};

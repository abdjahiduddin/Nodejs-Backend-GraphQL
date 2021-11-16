const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

// Import socket.io
const io = require("../socket");

// Import models
const Post = require("../models/post");
const User = require("../models/auth");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const itemPerPage = 2;

  try {
    const totalItems = await Post.find().countDocuments();

    const posts = await Post.find()
      .populate("creator", "name _id")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * itemPerPage)
      .limit(itemPerPage);

    res.status(200).json({
      message: "Fetched all posts successfully",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const error = validationResult(req);
  const title = req.body.title;
  const content = req.body.content;
  const image = req.file;

  if (!error.isEmpty()) {
    const err = new Error("Input validation failed");
    err.statusCode = 422;
    err.data = error.array();
    throw err;
  }

  if (!image) {
    const err = new Error(
      "No file or Attached file is not an image (jpeg/jpg/png)"
    );
    err.statusCode = 422;
    throw err;
  }

  try {
    const user = await User.findById(req.userId);

    const post = new Post({
      title: title,
      content: content,
      creator: req.userId,
      imageUrl: "images/" + image.filename,
    });
    const savePost = await post.save();

    user.posts.push(savePost);
    const result = await user.save();

    io.getIO().emit("posts", {
      action: "create",
      post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
    });

    res.status(201).json({
      message: "Post created successfully!",
      post: savePost,
      creator: result._id,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Data found",
      post: post,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const error = validationResult(req);
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let image = req.body.image;

  if (!error.isEmpty()) {
    const err = new Error("Input validation failed");
    err.statusCode = 422;
    err.data = error.array();
    throw err;
  }

  if (req.file) {
    image = "images/" + req.file.filename;
  }

  if (!image) {
    const err = new Error("No image uploaded");
    err.statusCode = 422;
    throw err;
  }

  try {
    const post = await Post.findById(postId).populate("creator", "name _id");
    if (!post) {
      const err = new Error("No post found");
      err.statusCode = 422;
      throw err;
    }

    if (req.userId.toString() !== post.creator._id.toString()) {
      const err = new Error("Not authorized");
      err.statusCode = 401;
      throw err;
    }

    if (image !== post.imageUrl) {
      deleteFile(post.imageUrl);
    }

    post.title = title;
    post.imageUrl = image;
    post.content = content;

    const result = await post.save();

    io.getIO().emit("posts", {
      action: "update",
      post: result,
    });

    res.status(200).json({
      message: "Post updated",
      post: result,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("No post found");
      error.statusCode = 422;
      throw err;
    }

    if (req.userId.toString() !== post.creator.toString()) {
      const err = new Error("Not authorized");
      err.statusCode = 401;
      throw err;
    }

    const user = await User.findById(req.userId);
    user.posts.pull(postId);

    const savedUser = await user.save();

    deleteFile(post.imageUrl);

    const deletedPost = await Post.findByIdAndDelete(postId);

    io.getIO().emit("posts", {
      action: "delete",
      post: postId,
    });
    res.status(200).json({
      message: "File deleted",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const deleteFile = (file) => {
  const filePath = path.join(__dirname, "..", file);
  fs.unlink(filePath, (err) => {
    if (err) console.log(err);
  });
};

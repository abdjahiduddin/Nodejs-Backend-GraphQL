const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    errorHandling("Not authorized", 401)
  }

  let decodedToken
  
  try {
    const token = authHeader.split(" ")[1];
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    error.statusCode = 500
    throw error
  }

  if (!decodedToken) {
    errorHandling("Token verification failed", 401)
  }
  req.userId = decodedToken.userId
  next()
};

errorHandling = (message, code) => {
  const error = new Error(message);
  error.statusCode = code;
  throw error;
};

const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    // console.log("Not Authenticated")
    req.isAuth = false
    return next()
  }

  let decodedToken
  
  try {
    const token = authHeader.split(" ")[1];
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // console.log("Not Authenticated")
    req.isAuth = false
    return next()
  }

  if (!decodedToken) {
    // console.log("Not Authenticated")
    req.isAuth = false
    return next()
  }
  req.userId = decodedToken.userId
  req.isAuth = true
  // console.log("Authenticated")
  // console.log(req.userId)
  // console.log(req.body)
  next()
};
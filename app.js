const path = require("path");
const fs = require("fs");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const { graphqlHTTP } = require("express-graphql");
const dotenv = require("dotenv");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

dotenv.config();

const graphqlSchema = require("./graphql/schema");
const graphqlResolvers = require("./graphql/resolvers");

const auth = require("./middleware/auth");

const MONGODB_URI = process.env.MONGODB_URI;
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = req.userId;
    const userPath = path.join(__dirname, "images", userDir);

    if (!fs.existsSync(userPath)) {
      fs.mkdir(userPath, (err) => {
        if (err) console.log(err);
      });
    }
    // cb(null, "images/" + userDir);
    cb(null, "images/");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    const err = new Error("Attached file is not an image (jpeg/jpg/png)");
    err.statusCode = 422;
    return cb(err);
  }
};

const app = express();

app.use(bodyParser.json());
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "script-src": [
        "'self'",
        "'unsafe-inline'",
        "https://message-graphql.herokuapp.com/",
      ],
    },
  })
);
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

app.use((req, res, next) => {
  console.log(req.method + " " + req.path + " - " + req.hostname);
  next();
});

app.use(auth);

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

app.put("/upload-image", (req, res, next) => {
  if (!req.isAuth) {
    const err = new Error("Not authenticated");
    err.code = 401;
    throw err;
  }

  if (req.body.oldImage === "undefined") {
    req.body.oldImage = undefined;
  }

  if (!req.file && req.body.oldImage === undefined) {
    const err = new Error("No image uploaded");
    err.statusCode = 422;
    throw err;
  }

  let image = req.body.oldImage;

  if (req.file) {
    // image = "images/" + req.userId + "/" + req.file.filename;
    image = "images/" + req.file.filename;
  }

  if (image !== req.body.oldImage && req.body.oldImage !== undefined) {
    const imagePath = path.join(__dirname, req.body.oldImage);
    fs.unlink(imagePath, (err) => {
      if (err) console.log(err);
    });
  }

  res.status(201).json({
    filePath: image,
  });
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolvers,
    graphiql: true,
    formatError(err) {
      if (!err.originalError) {
        return err;
      }

      const message = err.message || "An error occured";
      const status = err.originalError.code || 500;
      const data = err.originalError.data || [];

      return {
        message: message,
        status: status,
        data: data,
      };
    },
  })
);

// Error Handling
app.use((error, req, res, next) => {
  console.log("Error generated from middlleware error handling...");
  console.log(error);
  const code = error.statusCode || 500;
  const message = error.message;
  const data = error.data || "";
  res.status(code).json({
    message: message,
    data: data,
    code: code,
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((connect) => {
    console.log("Connected to database");

    app.listen(process.env.PORT || 8080, () => {
      console.log("Listen on port 8080");
    });
  })
  .catch((err) => console.log(err));

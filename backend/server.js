const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");

dotenv.config();

const app = express();
app.use(bodyParser.json());

const userRouter = require("./routes/users.js");
app.use("/users", userRouter);

const productsRouter = require("./routes/products.js");
app.use("/products", productsRouter);

const categoriesRouter = require("./routes/products.js");
app.use("/categories", categoriesRouter);

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});

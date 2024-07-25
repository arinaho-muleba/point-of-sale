const express = require("express");
const bodyParser = require("body-parser");
const Engine = require("tingodb")();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(bodyParser.json());

const db = new Engine.Db(__dirname + "/data", {});

// Collections
const productsCollection = db.collection("products");
const categoriesCollection = db.collection("categories");
const usersCollection = db.collection("users");

// Secret key for JWT
const secretKey = "jwt_secret";

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token)
    return res.status(403).send({ auth: false, message: "No token provided." });

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err)
      return res
        .status(500)
        .send({ auth: false, message: "Failed to authenticate token." });

    req.userId = decoded.id;
    next();
  });
};

// User authentication routes
app.post("/users/register", (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  usersCollection.insert(
    { username, password: hashedPassword },
    (err, user) => {
      if (err) return res.status(500).send(err);
      const token = jwt.sign({ id: user._id }, secretKey, { expiresIn: 600 });
      res.status(200).send({ auth: true, token });
    }
  );
});

app.post("/users/login", (req, res) => {
  const { username, password } = req.body;

  usersCollection.findOne({ username }, (err, user) => {
    if (err) return res.status(500).send("Error on the server.");
    if (!user) return res.status(404).send("No user found.");

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid)
      return res.status(401).send({ auth: false, token: null });

    const token = jwt.sign({ id: user._id }, secretKey, { expiresIn: 6000 });
    res.status(200).send({ auth: true, token });
  });
});

// Product routes
app.post("/products", verifyToken, (req, res) => {
  const products = req.body; // Assuming the request body contains an array of products

  // Check if it's a single product or an array
  if (!Array.isArray(products)) {
    products = [products]; // Convert single product to an array
  }

  // Loop through each product and insert them one by one
  let insertedProducts = [];
  products.forEach((product) => {
    const { name, description, price, quantity, category } = product;

    productsCollection.insert(
      { name, description, price, quantity, category },
      (err, insertedProduct) => {
        if (err) {
          return res.status(500).send("There was a problem adding a product.");
        }
        insertedProducts.push(insertedProduct);
      }
    );
  });
  // After all insertions are done, send the response
  Promise.all(insertedProducts).then(() => {
    res.status(201).send(insertedProducts); // Send all inserted products
  });
});

app.delete("/products/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  productsCollection.remove({ _id: id }, {}, (err, numRemoved) => {
    if (err)
      return res.status(500).send("There was a problem deleting the product.");
    res.status(200).send(`Number of products removed: ${numRemoved}`);
  });
});

app.get("/products", verifyToken, (req, res) => {
  productsCollection.find().toArray((err, items) => {
    if (err)
      return res
        .status(500)
        .send("There was a problem fetching the inventory.");
    res.status(200).send(items);
  });
});

app.put("/products/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, description, price, quantity, category } = req.body;

  productsCollection.update(
    { _id: id },
    { $set: { name, description, price, quantity, category } },
    {},
    (err, numReplaced) => {
      if (err)
        return res
          .status(500)
          .send("There was a problem updating the product.");
      res.status(200).send(`Number of products updated: ${numReplaced}`);
    }
  );
});

app.put("/products/:id/add", verifyToken, (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  productsCollection.update(
    { _id: id },
    { $inc: { quantity: quantity } },
    {},
    (err, numReplaced) => {
      if (err)
        return res
          .status(500)
          .send("There was a problem adding to the quantity.");
      res.status(200).send(`Number of products updated: ${numReplaced}`);
    }
  );
});

app.post("products/purchase", verifyToken, (req, res) => {
  const { productId, quantity } = req.body;

  productsCollection.findOne({ _id: productId }, (err, product) => {
    if (err)
      return res.status(500).send("There was a problem finding the product.");
    if (!product) return res.status(404).send("Product not found.");

    if (product.quantity < quantity)
      return res.status(400).send("Insufficient quantity.");

    const newQuantity = product.quantity - quantity;
    const profit = product.price * quantity;

    productsCollection.update(
      { _id: productId },
      { $set: { quantity: newQuantity } },
      {},
      (err, numReplaced) => {
        if (err)
          return res
            .status(500)
            .send("There was a problem updating the product quantity.");
        res.status(200).send({ message: "Purchase successful", profit });
      }
    );
  });
});

app.get("/products/search", verifyToken, (req, res) => {
  const { name, category } = req.query;
  const query = {};

  if (name) query.name = { $regex: new RegExp(name, "i") };
   if (category) query.category = category;

  productsCollection.find(query).toArray((err, items) => {
    if (err)
      return res
        .status(500)
        .send("There was a problem searching for products.");
    res.status(200).send(items);
  });
});

// Category routes
app.post("/categories", verifyToken, (req, res) => {
  const { name, description } = req.body;

  categoriesCollection.insert({ name, description }, (err, category) => {
    if (err)
      return res.status(500).send("There was a problem adding the category.");
    res.status(201).send(category);
  });
});

app.get("/categories", verifyToken, (req, res) => {
  categoriesCollection.find().toArray((err, items) => {
    if (err)
      return res
        .status(500)
        .send("There was a problem fetching the categories.");
    res.status(200).send(items);
  });
});

// const userRouter = require('./routes/users');
// app.use('/users', userRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

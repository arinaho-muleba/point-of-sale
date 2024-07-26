const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const { productsCollection } = require("../database/database");
const {verifyToken} = require("../controller/authentication")

router.post("/", verifyToken, (req, res) => {
  const products = req.body;

  if (!Array.isArray(products)) {
    products = [products];
  }

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

  Promise.all(insertedProducts).then(() => {
    res.status(201).send(insertedProducts);
  });
});

router.delete("/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  productsCollection.remove({ _id: id }, {}, (err, numRemoved) => {
    if (err)
      return res.status(500).send("There was a problem deleting the product.");
    res.status(200).send(`Number of products removed: ${numRemoved}`);
  });
});

router.get("/ts", verifyToken, (req, res) => {
  productsCollection.find().toArray((err, items) => {
    if (err)
      return res
        .status(500)
        .send("There was a problem fetching the inventory.");
    res.status(200).send(items);
  });
});

router.put("/:id", verifyToken, (req, res) => {
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

router.put("/:id/add", verifyToken, (req, res) => {
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

router.post("/purchase", verifyToken, (req, res) => {
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

router.get("/search", verifyToken, (req, res) => {
  const { name, category } = req.query;
  const query = {};

  console.log("working");

  if (name) query.name = new RegExp(name, "i");
  if (category) query.category = category;

  console.log(query);

  productsCollection.find(query).toArray((err, items) => {
    if (err)
      return res
        .status(500)
        .send("There was a problem searching for products.");
    res.status(200).send(items);
  });
});

router.get("/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  productsCollection.findOne({ _id: id }, (err, product) => {
    if (err) {
      return res
        .status(500)
        .send("There was a problem retrieving the product.");
    }
    if (!product) {
      return res.status(404).send("Product not found.");
    }
    res.status(200).send(product);
  });
});

module.exports = router;

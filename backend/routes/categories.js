const express = require("express");
const router = express.Router();
const { categoriesCollection } = require("../database/database");
const { verifyToken } = require("../middleware/authentication");

router.post("/", verifyToken, (req, res) => {
  const { name, description } = req.body;

  categoriesCollection.insert({ name, description }, (err, category) => {
    if (err)
      return res.status(500).send("There was a problem adding the category.");
    res.status(201).send(category);
  });
});

router.get("/", verifyToken, (req, res) => {
  categoriesCollection.find().toArray((err, items) => {
    if (err)
      return res
        .status(500)
        .send("There was a problem fetching the categories.");
    res.status(200).send(items);
  });
});

module.exports = router;

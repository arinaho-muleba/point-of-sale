const fs = require("fs");
const path = require("path");
const Engine = require("tingodb")();

const dataDir = path.join(__dirname, "data");

console.log(dataDir);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Engine.Db(dataDir, {});

const productsCollection = db.collection("products");
const categoriesCollection = db.collection("categories");
const usersCollection = db.collection("users");

module.exports = { productsCollection, categoriesCollection, usersCollection };

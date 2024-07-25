const fs = require("fs");
const path = require("path");
const Engine = require("tingodb")();

// Define the path to the data directory
const dataDir = path.join(__dirname, "data");

console.log(dataDir);

// Check if the directory exists, and create it if it doesn't
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize the database
const db = new Engine.Db(dataDir, {});

// Collections
const productsCollection = db.collection("products");
const categoriesCollection = db.collection("categories");
const usersCollection = db.collection("users");

module.exports = { productsCollection, categoriesCollection, usersCollection };

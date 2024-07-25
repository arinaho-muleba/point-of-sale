const Engine = require('tingodb')();

const db = new Engine.Db(__dirname + '../../data', {});

// Collections
const products = db.collection('products');
const categories = db.collection('categories');
const users = db.collection('users');

module.exports = {products, categories, users}
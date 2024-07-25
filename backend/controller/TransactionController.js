const express = require('express');
const router = express.Router();
const { connectToBucket } = require('../core/connectionconfig');
const dotenv = require('dotenv');
dotenv.config();

router.post('/', async (req, res) => {
    try {
        const bucket = await connectToBucket();
        const collection = bucket.defaultCollection();

        const { items, total } = req.body;

        const transaction = {
            type: 'transaction',
            items,
            total,
            timestamp: new Date().toISOString()
        };

        const result = await collection.insert(`transaction_${Date.now()}`, transaction);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const bucket = await connectToBucket();

        const query = `SELECT * FROM \`${process.env.BUCKET_NAME}\`.\`${process.env.SCOPE_NAME}\`.\`${process.env.COLLECTION_NAME}\``;
        const queryResult = await bucket.scope(process.env.SCOPE_NAME).query(query);

        res.json(queryResult.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

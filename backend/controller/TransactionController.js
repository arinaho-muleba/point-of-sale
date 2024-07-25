const express = require('express');
const router = express.Router();
const { connectToBucket } = require('../core/connectionconfig');
const dotenv = require('dotenv');
dotenv.config();

const { transaction } = require('../data-facade/transaction'); 

router.post('/', async (req, res) => {
    try {
        const bucket = await connectToBucket();
        const scope = bucket.scope(process.env.SCOPE_NAME);
        const collection = scope.collection(process.env.COLLECTION_NAME);

        const { customerId, items, totalAmount, paymentMethod, storeId, salespersonId, additionalDetails } = req.body;

        const newTransaction = {
            transactionId: `transaction_${Date.now()}`,
            timestamp: new Date().toISOString(),
            customerId,
            items,
            totalAmount,
            paymentMethod,
            transactionStatus: 'pending',
            storeId,
            salespersonId,
            additionalDetails
        };

        const result = await collection.insert(newTransaction.transactionId, newTransaction);

        res.status(201).json({ transactionId: newTransaction.transactionId, message: 'Transaction inserted successfully' });
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

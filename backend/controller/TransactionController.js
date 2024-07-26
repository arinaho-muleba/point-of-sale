const express = require('express');
const router = express.Router();
const { connectToBucket } = require('../core/connectionconfig');
const dotenv = require('dotenv');
dotenv.config();

// Helper function to validate item structure
const validateItems = (items) => {
    if (!Array.isArray(items)) return false;
    return items.every(item =>
        item.productId &&
        item.productName &&
        item.quantity &&
        item.productPrice &&
        item.totalPrice
    );
};

// Create a new transaction
router.post('/transaction', async (req, res) => {
    try {
        const bucket = await connectToBucket();
        const scope = bucket.scope(process.env.SCOPE_NAME);
        const collection = scope.collection(process.env.COLLECTION_NAME);

        const { customerId, items, totalAmount, paymentMethod, storeId, salespersonId, additionalDetails } = req.body;

        if (!customerId || !items || !totalAmount || !paymentMethod || !storeId || !salespersonId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!validateItems(items)) {
            return res.status(400).json({ message: 'Invalid items format' });
        }

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

        await collection.insert(newTransaction.transactionId, newTransaction);

        res.status(201).json({ transactionId: newTransaction.transactionId, message: 'Transaction created successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Retrieve a specific transaction by ID
router.get('/transaction/:id', async (req, res) => {
    try {
        const bucket = await connectToBucket();
        const scope = bucket.scope(process.env.SCOPE_NAME);
        const collection = scope.collection(process.env.COLLECTION_NAME);
        const transactionId = req.params.id;

        const result = await collection.get(transactionId);
        res.json(result.content);
    } catch (err) {
        if (err.message.includes('document not found')) {
            res.status(404).json({ message: 'Transaction not found' });
        } else {
            res.status(500).json({ message: err.message });
        }
    }
});

// Update the status of a transaction
router.patch('/transaction/:id', async (req, res) => {
    try {
        const bucket = await connectToBucket();
        const scope = bucket.scope(process.env.SCOPE_NAME);
        const collection = scope.collection(process.env.COLLECTION_NAME);
        const transactionId = req.params.id;
        const { transactionStatus } = req.body;

        if (!transactionStatus) {
            return res.status(400).json({ message: 'Transaction status is required' });
        }

        const result = await collection.get(transactionId);
        const updatedTransaction = {
            ...result.content,
            transactionStatus
        };

        await collection.upsert(transactionId, updatedTransaction);
        res.json({ message: 'Transaction status updated successfully' });
    } catch (err) {
        if (err.message.includes('document not found')) {
            res.status(404).json({ message: 'Transaction not found' });
        } else {
            res.status(500).json({ message: err.message });
        }
    }
});

// Retrieve all transactions
router.get('/transactions', async (req, res) => {
    try {
        const bucket = await connectToBucket();
        const scope = bucket.scope(process.env.SCOPE_NAME);
        const query = `SELECT * FROM \`${process.env.BUCKET_NAME}\`.\`${process.env.SCOPE_NAME}\`.\`${process.env.COLLECTION_NAME}\``;
        const queryResult = await scope.query(query);

        res.json(queryResult.rows.map(row => row[process.env.COLLECTION_NAME]));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

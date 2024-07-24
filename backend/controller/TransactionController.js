const express = require('express');
const router = express.Router();

const couchbase = require('couchbase');

const clusterConnStr = 'couchbase://localhost';
const username = '<username>';
const password = '<password>';
const bucketName = '<bucketname>';
const scopeName = '<scopename>';
const collectionName = '<collectionname>';

// Function to connect to Couchbase cluster and return the bucket
async function connectToBucket() {
    const cluster = await couchbase.connect(clusterConnStr, {
        username,
        password
    });

    const bucket = cluster.bucket(bucketName);

    return bucket;
}

// POST route to insert a transaction document
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

        // Insert the document into Couchbase
        const result = await collection.insert(`transaction_${Date.now()}`, transaction);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET route to fetch all transactions
router.get('/', async (req, res) => {
    try {
        const bucket = await connectToBucket();

        // Perform a N1QL query to fetch all documents in the collection
        const query = `SELECT * FROM \`${bucketName}\`.\`${scopeName}\`.\`${collectionName}\``;
        const queryResult = await bucket.scope(scopeName).query(query);

        res.json(queryResult.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

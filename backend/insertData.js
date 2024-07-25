const { connectToBucket } = require('./core/connectionconfig');
const dotenv = require('dotenv');
dotenv.config();

async function insertData() {
    try {
        // Connect to the Couchbase bucket and obtain the collection
        const bucket = await connectToBucket();

        const scope = bucket.scope(process.env.SCOPE_NAME);
        const collection = scope.collection(process.env.COLLECTION_NAME);

        // Data to be inserted
        const documentId = 'transaction_123';
        const document = {
            type: 'transaction',
            items: [
                { name: 'Product A', quantity: 2, price: 10 },
                { name: 'Product B', quantity: 1, price: 15 }
            ],
            total: 35,
            timestamp: new Date().toISOString()
        };

        // Insert the document into the collection
        const result = await collection.insert(documentId, document);
        console.log('Document inserted:', result);

    } catch (error) {
        console.error('Error inserting document:', error);
    }
}

insertData();

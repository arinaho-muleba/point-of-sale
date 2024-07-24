const couchbase = require('couchbase');

const clusterConnStr = 'couchbase://localhost';
const username = 'Administrator';
const password = 'never123fall';
const bucketName = 'sales';
const scopeName = 'tenant_agent_00'; 
const collectionName = 'transactions';

async function insertData() {
    const cluster = await couchbase.connect(clusterConnStr, {
        username,
        password
    });

    const bucket = cluster.bucket(bucketName);
    const scope = bucket.scope(scopeName);
    const collection = scope.collection(collectionName);
    console.log('success');

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

    try {
        const result = await collection.insert(documentId, document);
        console.log('Document inserted:', result);
    } catch (error) {
        console.error('Error inserting document:', error);
    }
}

insertData();

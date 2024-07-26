const couchbase = require('couchbase');
const dotenv = require('dotenv');
dotenv.config();

const config = {
    clusterConnStr: process.env.CLUSTER_CONN_STR,
    username: process.env.CUSERNAME,
    password: process.env.PASSWORD,
    bucketName: process.env.BUCKET_NAME,
    scopeName: process.env.SCOPE_NAME,
    collectionName: process.env.COLLECTION_NAME 
};

const connectToBucket = async () => {
    try {
        console.log(config)
        const cluster = await couchbase.connect(config.clusterConnStr, {
            username: config.username,
            password: config.password
        });

        return cluster.bucket(config.bucketName);
    } catch (error) {
        throw error;  
    }
};

module.exports = { connectToBucket };

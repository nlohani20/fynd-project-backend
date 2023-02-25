// import { MongoClient } from 'mongodb';

const { MongoClient } = require('mongodb');

const connectToMongoDB = async () => {
    const url = process.env.MONGO_URL;
    // const url = 'mongodb://127.0.0.1:27017';
    const client = await MongoClient.connect(
        url,
        { useNewUrlParser: true, useUnifiedTopology: true },
    );
    const db = client.db('garden');
    return db;
}

module.exports = { connectToMongoDB };
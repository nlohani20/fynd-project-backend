import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import history from 'connect-history-api-fallback';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()

// var express = require('express');
// var bodyParser = require('body-parser');
// var path = require('path');
var guserId;

const { connectToMongoDB } = require('./mongo-connection-util');

const app = express();
app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, '../assets')));
// app.use(express.static(path.resolve(__dirname, '../dist'), { maxAge: '1y', etag:false }));
// app.use(history());

app.get('/api/products', async (req, res) => {
  const db = await connectToMongoDB();
  const products = await db.collection('products').find({}).toArray();
  res.status(200).json(products);
});

//depreciated get
app.get('/api/users/:userId/cart', async (req, res) => {
  const { userId } = req.params;
  const db = await connectToMongoDB();
  const user = await db.collection('users').findOne({ uid: userId });
  if (!user) return res.status(404).json('Could not find user!');
  const products = await db.collection('products').find({}).toArray();
  const cartItemIds = user.cartItems;
  const cartItems = cartItemIds.map(pid =>
    products.find(product => product.pid === pid));
  res.status(200).json(cartItems);
});

app.get('/api/cart', async (req, res) => {
  const db = await connectToMongoDB();
  const user = await db.collection('users').findOne({ _id: guserId });
  if (!user) return res.status(404).json('Could not find user!');
  const products = await db.collection('products').find({}).toArray();
  const cartItemIds = user.cartItems;
  const cartItems = cartItemIds.map(pid =>
    products.find(product => product.pid === pid));
  res.status(200).json(cartItems);
});

app.get('/api/products/:productId', async (req, res) => {
  const { productId } = req.params;
  const db = await connectToMongoDB();
  const product = await db.collection('products').findOne({ pid: productId });
  if (product) {
    res.status(200).json(product);
  } else {
    res.status(404).json('Could not find the product!');
  }
});

app.get('/api/users', async (req, res) => {
  const db = await connectToMongoDB();
  const users = await db.collection('users').find({}).toArray();
  res.status(200).json(users);
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const db = await connectToMongoDB();
  const users = await db.collection('users');
  users.findOne({ email: email }, (err, user) => {
    if (err) return res.status(500).json({
      title: 'server error',
      error: err,
    });
    if (!user) return res.status(200).json({
      title: 'login failed',
      error: 'invalid email',
    });
    if (password !== user.password) return res.status(200).json({
      title: 'login failed',
      error: 'invalid password',
    });
    if (password === user.password) {
      guserId = user._id;
      return res.status(200).json({
        title: 'login success',
        user
      });
    }
  });
})

app.post('/api/users', async (req, res) => {
  const { name, email, password, phone, gender } = req.body;
  const db = await connectToMongoDB();
  const user = { name: name, email: email, password: password, phone: phone, gender: gender, cartItems: [] }
  const users = await db.collection('users').insertOne(user);
  res.status(201).json(user);
});

//depreciated add method
app.post('/api/users/:userId/cart/:productId', async (req, res) => {
  const { userId } = req.params;
  const { productId } = req.params;
  const db = await connectToMongoDB();
  await db.collection('users').updateOne({ uid: userId }, {
    $addToSet: { cartItems: productId }
  });
  const products = await db.collection('products').find({}).toArray();
  const user = await db.collection('users').findOne({ uid: userId });
  const cartItemIds = user.cartItems;
  const cartItems = cartItemIds.map(pid =>
    products.find(product => product.pid === pid));
  res.status(200).json(cartItems);
});

//depreciated add method
app.post('/api/users/:userId/cart', async (req, res) => {
  const { userId } = req.params;
  const { productId } = req.body;
  const db = await connectToMongoDB();
  await db.collection('users').updateOne({ uid: userId }, {
    $addToSet: { cartItems: productId }
  });
  const products = await db.collection('products').find({}).toArray();
  const user = await db.collection('users').findOne({ uid: userId });
  const cartItemIds = user.cartItems;
  const cartItems = cartItemIds.map(pid =>
    products.find(product => product.pid === pid));
  res.status(200).json(cartItems);
});

app.post('/api/cart/:productId', async (req, res) => {
  const { productId } = req.params;
  const db = await connectToMongoDB();
  await db.collection('users').updateOne({ _id: guserId }, {
    $addToSet: { cartItems: productId }
  });
  const products = await db.collection('products').find({}).toArray();
  const user = await db.collection('users').findOne({ _id: guserId });
  const cartItemIds = user.cartItems;
  const cartItems = cartItemIds.map(pid =>
    products.find(product => product.pid === pid));
  res.status(200).json(cartItems);
});

app.post('/api/cart', async (req,res) => {
  const { productId } = req.body;
  const db = await connectToMongoDB();
  await db.collection('users').updateOne({ _id: guserId }, {
    $addToSet: { cartItems: productId }
  });
  const products = await db.collection('products').find({}).toArray();
  const user = await db.collection('users').findOne({ _id: guserId });
  const cartItemIds = user.cartItems;
  const cartItems = cartItemIds.map(pid =>
    products.find(product => product.pid === pid));
  res.status(200).json(cartItems);
});

//depreciated delete
app.delete('/api/users/:userId/cart/:productId', async (req, res) => {
  const { userId, productId } = req.params;
  const db = await connectToMongoDB();
  await db.collection('users').updateOne({ uid: userId }, {
    $pull: { cartItems: productId }
  });
  const products = await db.collection('products').find({}).toArray();
  const user = await db.collection('users').findOne({ uid: userId });
  const cartItemIds = user.cartItems;
  const cartItems = cartItemIds.map(pid =>
    products.find(product => product.pid === pid));
  res.status(200).json(cartItems);
});

app.delete('/api/cart/:productId', async (req, res) => {
  const { productId } = req.params;
  const db = await connectToMongoDB();
  await db.collection('users').updateOne({ _id: guserId }, {
    $pull: { cartItems: productId }
  });
  const products = await db.collection('products').find({}).toArray();
  const user = await db.collection('users').findOne({ _id: guserId });
  const cartItemIds = user.cartItems;
  const cartItems = cartItemIds.map(pid =>
    products.find(product => product.pid === pid));
  res.status(200).json(cartItems);
});

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../dist/index.html'));
// });

app.listen(process.env.PORT || 8000, () => {
  console.log('Server is listening on port 8000');
});
const dotenv = require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyparser = require('body-parser');

const shopifyApiPublicKey = process.env.SHOPIFY_API_PUBLIC_KEY;
const shopifyApiSecretKey = process.env.SHOPIFY_API_SECRET_KEY;
const scopes = 'write_products';
const appUrl = 'https://fa72353e9ab6.ngrok.io';

const app = express();
const PORT = 8081;

const templateRoutes = require("./routes/templateRoutes");

app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));

app.use('/api',templateRoutes);

mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser:true,
    useUnifiedTopology:true
});

mongoose.connection.on('connected',()=>{
    console.log('DB CONNECTED!')
});

mongoose.connection.on('error',()=>{
    console.log('ERROR CONNECTING TO DB!')
});

app.get('/', (req, res) => {
  res.send('Utkarsh Kashyap')
});


const buildRedirectUri = () => `${appUrl}/shopify/callback`;

const buildInstallUrl = (shop, state, redirectUri) => `https://${shop}/admin/oauth/authorize?client_id=${shopifyApiPublicKey}&scope=${scopes}&state=${state}&redirect_uri=${redirectUri}`;

const buildAccessTokenRequestUrl = (shop) => `https://${shop}/admin/oauth/access_token`;

const buildShopDataRequestUrl = (shop) => `https://${shop}/admin/shop.json`;

const generateEncryptedHash = (params) => crypto.createHmac('sha256', shopifyApiSecretKey).update(params).digest('hex');

const fetchAccessToken = async (shop, data) => await axios(buildAccessTokenRequestUrl(shop), {
  method: 'POST',
  data
});

const fetchShopData = async (shop, accessToken) => await axios(buildShopDataRequestUrl(shop), {
  method: 'GET',
  headers: {
    'X-Shopify-Access-Token': accessToken
  }
});

const getCustomer = async(access_token,shop,body) => await axios(`https://${shop}/admin/api/2021-01/customers.json`,{
  method:'get',
  headers : {
    'X-Shopify-Access-Token': access_token
  },
  data:body
})


app.get('/shopify', (req, res) => {
  const shop = req.query.shop;

  if (!shop) { return res.status(400).send('no shop')}

  const state = nonce();
  const installShopUrl = buildInstallUrl(shop, state, buildRedirectUri())

  res.cookie('state', state) // should be encrypted in production
  res.redirect(installShopUrl);
});

app.get('/shopify/callback', async (req, res) => {
  const { shop, code, state } = req.query;
  const stateCookie = cookie.parse(req.headers.cookie).state;
  
  if (state !== stateCookie) { return res.status(403).send('Cannot be verified')}

  const { hmac, ...params } = req.query
  const queryParams = querystring.stringify(params)
  const hash = generateEncryptedHash(queryParams)

  if (hash !== hmac) { return res.status(400).send('HMAC validation failed')}

  try {
    const data = {
      client_id: shopifyApiPublicKey,
      client_secret: shopifyApiSecretKey,
      code
    };
    const tokenResponse = await fetchAccessToken(shop, data)

    const { access_token } = tokenResponse.data
    const shopData = await fetchShopData(shop, access_token);
    console.log("ACCESS TOKEN :",access_token);
    res.send(shopData.data.shop);
    // const body = {
    //   "customer": {
    //     "first_name": "Steve",
    //     "last_name": "Lastnameson",
    //     "email": "steve.lastnameson@example.com",
    //     "phone": "+15142546011",
    //     "verified_email": true,
    //     "addresses": [
    //       {
    //         "address1": "123 Oak St",
    //         "city": "Ottawa",
    //         "province": "ON",
    //         "phone": "555-1212",
    //         "zip": "123 ABC",
    //         "last_name": "Lastnameson",
    //         "first_name": "Mother",
    //         "country": "CA"
    //       }
    //     ]
    //   }
    // }
    // const customer = await getCustomer(access_token,shop,body)
    // res.send(customer.data);
  } catch(err) {
    console.log(err)
    res.status(500).send('something went wrong')
  }
});


app.listen(PORT, () => console.log(`listening at ${PORT}`));
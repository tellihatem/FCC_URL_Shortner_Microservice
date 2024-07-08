require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
//const { MongoClient } = require('mongodb')
const dns = require('dns')
const {URL} = require('url')

//const client = new MongoClient ("mongodb+srv://hatemtelli:Nogameno01@fcc.ln6e3xc.mongodb.net/?retryWrites=true&w=majority&appName=FCC")

//const db = client.db("shorturls")
//const urls = db.collection("urls")

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

const MONGOURL = process.env.DB_URL;

mongoose.connect(MONGOURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Database connected successfully.");
  })
  .catch(err => {
    console.error("Database connection error:", err);
  });

// Define the schema for the url data using Mongoose
const urlSchema = new mongoose.Schema({
  url: String,
  short: Number,
});

// Create a Mongoose model called "urlModel" based on the urlSchema
const urlModel = mongoose.model("shorturl", urlSchema);

//Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  const url = req.body.url
  //console.log(url)
  const urlparser = new URL(url);
  const dnslookup = dns.lookup(urlparser.hostname,async (err , address) => {
    //console.log(address)
    if (err){
      res.json({error : "Invalid Url"})
    }else{
      let existingUrl = await urlModel.findOne({ url });
      if (existingUrl) {
        return res.status(200).json({
          original_url : url,
          short_url : existingUrl.short
        });
      }else{
        const countUrl = await urlModel.countDocuments({})
        //console.log(countUrl)
        newcountUrl = countUrl + 1
        // Create a new URL document
        const newUrl = new urlModel({ url, short: newcountUrl});
        await newUrl.save();
        //const result = await urlModel.insertOne(urlDoc)
        res.json({
          original_url : url,
          short_url : newcountUrl
        })
      }
    }
  })
});

app.get('/api/shorturl/:short_url' , async (req,res) => {
  const shorturl = req.params.short_url
  let existingUrl = await urlModel.findOne({ short : shorturl });
  res.redirect(existingUrl.url)
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

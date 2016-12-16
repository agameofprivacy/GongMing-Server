
global.__base = __dirname + '/';

var request = require('request');

exports.request = request;

// var firebase = require('firebase');
// exports.firebase = firebase;

// firebase.initializeApp({
//   databaseURL: 'https://speakout-9d07b.firebaseio.com',
//   serviceAccount: './gongMingServiceAccount.json',
//   databaseAuthVariableOverride: {
//     uid: "my-service-worker"
//   }
// });

// var db = firebase.database();
// exports.db = db;

var express = require('express')
  , http = require('http')
  , path = require('path')
  , gongMingRoutes = require('./routes/gongMing_routes');

var bodyParser = require('body-parser');
exports.bodyParser = bodyParser;
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });

app.get('/getLegislatorsWithLatLon', gongMingRoutes.getLegislatorsWithLatLon);

var server = app.listen(process.env.PORT || '8080', function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

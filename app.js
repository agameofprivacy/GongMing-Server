
global.__base = __dirname + '/';

var firebase = require('firebase');

firebase.initializeApp({
  databaseURL: 'https://speakout-3d3be.firebaseio.com',
  serviceAccount: './speakoutServiceAccount.json'
});


var ref = firebase.database().ref();

var FirebaseCloudMessaging = require('fcm-push');

var fcmServerKey = 'AIzaSyC8EGOvPLThFunaXZuRescjHZOAJPVMcMM';
var fcm = new FirebaseCloudMessaging(fcmServerKey);


exports.firebase = firebase;
exports.ref = ref;

var express = require('express')
  , http = require('http')
  , path = require('path')
  , speakoutRoutes = require('./routes/speakout_routes');
var bodyParser = require('body-parser');
exports.bodyParser = bodyParser;
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.get('/',speakoutRoutes.index);
app.post('/getDistrictWithLatLong', speakoutRoutes.getDistrictWithLatLong);

var serverTestLog = ref.child('serverTestLog');
var newServerLog = serverTestLog.push();

newServerLog.set({
  message:"up and running"
});

var server = app.listen(process.env.PORT || '8080', function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});


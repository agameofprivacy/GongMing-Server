
global.__base = __dirname + '/';

var sunlightAPIKey = "5503cb1366e0492a9be0c6e496cff1b8";
var request = require('request');


var firebase = require('firebase');
exports.firebase = firebase;

firebase.initializeApp({
  databaseURL: 'https://speakout-9d07b.firebaseio.com',
  serviceAccount: './speakoutServiceAccount.json'
});


var db = firebase.database();
exports.db = db;
var userInfoRef = db.ref("userInfo");

userInfoRef.on("child_changed", function(snapshot) {
  console.log(snapshot.val());
  var userInfo = snapshot.val();
  var currentLatitude = userInfo["currentLatitude"];
  var currentLongitude = userInfo["currentLongitude"];
  getDistrictWithLatLong(currentLatitude, currentLongitude, function(data){
    if (data != "error"){
      snapshot.ref.update({"currentDistrictNumber":data["district"], "currentDistrictState":data["state"]});
    }
    else{
      console.log(data);
    }
  });
}, function (errorObject) {
  console.log("The read failed: " + errorObject.code);
});


var FirebaseCloudMessaging = require('fcm-push');

var fcmServerKey = 'AIzaSyC8EGOvPLThFunaXZuRescjHZOAJPVMcMM';
var fcm = new FirebaseCloudMessaging(fcmServerKey);

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
app.post('/updateUserInfo', speakoutRoutes.updateUserInfo);
app.post('/loadFeaturedCampaign', speakoutRoutes.loadFeaturedCampaign);
app.post('/loadStoriesForCampaign', speakoutRoutes.loadStoriesForCampaign);
app.post('/likeStory', speakoutRoutes.likeStory);
app.post('/reportStory', speakoutRoutes.reportStory);
app.post('/recordSpeakout', speakoutRoutes.recordSpeakout);
app.post('/submitTake', speakoutRoutes.submitTake);
app.post('/loadCandidatesForEquality', speakoutRoutes.loadCandidatesForEquality);
app.post('/loadIssues', speakoutRoutes.loadIssues);

var server = app.listen(process.env.PORT || '8080', function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});

// listen for change in userInfo > uid > currentLatitude, then update congressional district info for said userInfo


function getDistrictWithLatLong(lat, long, callback){
    var url = "http://congress.api.sunlightfoundation.com/districts/locate?apikey=" + sunlightAPIKey;

    request(url + '&latitude=' + lat + '&longitude=' + long, function(err, res, body) {
        if (!err && res.statusCode == 200) {
            var responseData = JSON.parse(body).results[0];
            console.log(responseData);
            callback(responseData);
        }
        else{
            console.log(err);
            callback("error");
        }
    });

};
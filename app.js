
global.__base = __dirname + '/';

var sunlightAPIKey = "5503cb1366e0492a9be0c6e496cff1b8";
var request = require('request');
var moment = require('moment');
exports.sunlightAPIKey = sunlightAPIKey;
exports.moment = moment;
exports.request = request;

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

// Code to add more campaign
// var campaignRef = db.ref("campaign");
// var newCampaign = campaignRef.push();
// newCampaign.set({
//   "shortTitle":"",
//   "fullTitle":"",
//   "geoTitle":"",
//   "blurb":"",
//   "country":"us",
//   "districts":["AZ-4", "CA-8"],
//   "heroImageURL":"http://www.charlottefive.com/wp-content/uploads/2016/03/HB2PROTEST-0324-JFK-01.jpg",
//   "active":false
// });

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
app.post('/loadLatestActiveCampaignForUser', speakoutRoutes.loadLatestActiveCampaignForUser);
app.post('/loadStoriesForCampaign', speakoutRoutes.loadStoriesForCampaign);
app.post('/likeStory', speakoutRoutes.likeStory);
app.post('/reportStory', speakoutRoutes.reportStory);
app.post('/recordSpeakout', speakoutRoutes.recordSpeakout);
app.post('/submitStory', speakoutRoutes.submitStory);
app.post('/loadCandidatesForEquality', speakoutRoutes.loadCandidatesForEquality);
app.post('/loadIssues', speakoutRoutes.loadIssues);
app.post('/updateStoryImageURLForStory', speakoutRoutes.updateStoryImageURLForStory);
app.post('/updateStoryAudioURLForStory', speakoutRoutes.updateStoryAudioURLForStory);
app.post('/getLegislatorInfoAndContactForUser', speakoutRoutes.getLegislatorInfoAndContactForUser);
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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

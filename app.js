
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

var FirebaseCloudMessaging = require('fcm-push');

var fcmServerKey = 'AIzaSyBsh7o8tjppsPpyUdCmHPYQX2iedL4iPPY';
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
app.post('/loadLatestActiveCampaignForLatLong', speakoutRoutes.loadLatestActiveCampaignForLatLong);

app.post('/loadStoriesForCampaignBeforeTime', speakoutRoutes.loadStoriesForCampaignBeforeTime);
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


// var message = {
//     to: "foEVrS4d0UA:APA91bHW6QmDo6UBHiIGKr_55nTzV7Ra1H5ly7Q9QgGpe8TbsLRafNBrVhzf3lX4RujTqVPjF_RMsO7xb2L3uxMjVijI-uiE1X6b2K6LoWkTADFshPY2lX0d77uokGhKQcZb683-PwcM", // required
//     priority : 'high',
//     notification: {
//       title: "Speakout Against HB2",
//       body: "HB2 is being debated on the floor tomorrow. Speakout and call your legislators to tell them you're against it now!",
//       'click-action': "speakout"
//     },         
//     data:{
//       'content-available':true,
//       "category": "speakout"
//     }
// };

// fcm.send(message, function(err, response){
//     if (err) {
//         console.log("Something has gone wrong!");
//         console.log(err);
//     } else {
//         console.log("Successfully sent with response: ", response);
//     }
// });

// Code to add more legislator
var candidateRef = db.ref("candidate");
var newCandidate = candidateRef.push();
newCandidate.set({
  "first_name":"John",
  "last_name":"Smith",
  "country":"us",
  "districts":["AZ-4", "CA-8"],
  "heroImageURL":"http://www.charlottefive.com/wp-content/uploads/2016/03/HB2PROTEST-0324-JFK-01.jpg",
  "office":""
});



// Code to add more legislator
// var legislatorRef = db.ref("legislator");
// var newLegislator = legislatorRef.push();
// newLegislator.set({
//   "first_name":"John",
//   "last_name":"Smith",
//   "country":"us",
//   "districts":["AZ-4", "CA-8"],
//   "heroImageURL":"http://www.charlottefive.com/wp-content/uploads/2016/03/HB2PROTEST-0324-JFK-01.jpg",
//   "active":false
// });

// code to add all ca districts to campaign with ID
// var campaignKey = "-KSWkjYPh_s-H-TEVLvs";
// var campaignRef = db.ref("campaign/" + campaignKey);
// var campaignDistrictsRef = campaignRef.child("districts");
// var numDistricts = 47;
// for (var i = 1; i <= 53; i++){
//   var districtString = "CA-"+i;
//   campaignDistrictsRef.child(districtString).set(true);
// }

// Code to add more campaignRef
// var campaignRef = db.ref("campaign");
// var newCampaign = campaignRef.push();
// newCampaign.set({
//   		"active": true,
// 		"fullTitle":"القانون اللواط",
// 		"shortTitle":"المادة 177",
// 		"geoTitle":"دبي",
// 		"blurb":"المادة 177 من قانون العقوبات لإمارة دبي تقر عقوبة تصل إلى 10 سنوات للمتهمين بممارسة اللواط.[6] التصور الأكثر شيوعًا من قبل وسائل الإعلام المحلية تجاه الأناس الإل جي بي تي ذات علاقة، المرض، وجرائم جنسية كالإغتصاب.",
// 		"districts":
// {
// "CA-23":true,
//         "CA-24":true,
//         "CA-25":true,
//         "CA-26":true,
//         "CA-27":true,
//         "CA-28":true,
//         "CA-29":true,
//         "CA-30":true,
//         "CA-31":true,
//         "CA-32":true,
//         "CA-33":true,
//         "CA-34":true,
//         "CA-35":true,
//         "CA-36":true,
//         "CA-37":true,
//         "CA-38":true,
//         "CA-39":true,
//         "CA-40":true,
//         "CA-41":true,
//         "CA-42":true,
//         "CA-43":true,
//         "CA-44":true,
//         "CA-45":true,
//         "CA-46":true,
//         "CA-47":true
// },
// 		"country":"ae",
// 		"tags":
// {
// 0:"القانون اللواط"
// },
// 		"position": false,
// 		"heroImageURL":""

// });


var app = require(__base + '/app.js');
var firebase = app.firebase;
var db = app.db;



exports.updateUserInfo = function(req, res){
    var requestParameters = req.body;
    return res.send({success:true, message:"default message"});
};

exports.loadLatestActiveCampaignForUser = function(req, res){
    var requestParameters = req.body;
    var uid = requestParameters.uid;
    var userInfoRef = db.ref("userInfo/" + uid);
    userInfoRef.on("value", function(snapshot) {
        var districtString = snapshot.val()["currentDistrictState"] + "-" + snapshot.val()["currentDistrictNumber"];
        console.log("user district string is:" + districtString);
        var campaignRef = db.ref("campaign");
        campaignRef.orderByChild("active").equalTo(true).once("value", function(snapshot){
            console.log("snapshot has children of " + snapshot.numChildren());
            if (snapshot.numChildren() > 0) {
                snapshot.forEach(function(campaign) {
                    for(var district in campaign.val()["districts"]){
                        console.log("campaign district string is:" + district);
                        if (district == districtString){
                            console.log(campaign.val());
                            return res.send({success:true, campaign:campaign.val()});     
                        }
                    }
                });
            }
    });
    }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
    });
};

exports.loadStoriesForCampaign = function(req, res){
    return res.send({success:true, message:"default message"});
};

exports.likeStory = function(req, res){
    return res.send({success:true, message:"default message"});
};

exports.reportStory = function(req, res){
    return res.send({success:true, message:"default message"});
};

exports.recordSpeakout = function(req, res){
    return res.send({success:true, message:"default message"});
};

exports.submitTake = function(req, res){
    return res.send({success:true, message:"default message"});
};

exports.loadCandidatesForEquality = function(req, res){
    return res.send({success:true, message:"default message"});
};

exports.loadIssues = function(req, res){
    return res.send({success:true, message:"default message"});
};




/*
placeholder apis
*/

exports.index = function(req,res){
    console.log("index function");
    console.log(req.params)
    return res.send({ success : true, message : 'success returned from speakout nodejs server' });
};

exports.getDistrictWithLatLong = function(req, res){
  //req.body is your array of objects now:
  console.log(req.body);
  console.log(req.body.latitude);
  // [{id:134123, url:'www.qwer.com'},{id:131211,url:'www.asdf.com'}]
  return res.send({success:true, message:"district returned"})
};
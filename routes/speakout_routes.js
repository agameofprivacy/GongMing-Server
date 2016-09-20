
var app = require(__base + '/app.js');
var firebase = app.firebase;
var db = app.db;



exports.updateUserInfo = function(req, res){
    var requestParameters = req.body;
    return res.send({success:true, message:"default message"});
};

exports.loadFeaturedCampaign = function(req, res){
    var requestParameters = req.body;
    var uid = requestParameters.uid;
    
    return res.send({success:true, message:"default message"});
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
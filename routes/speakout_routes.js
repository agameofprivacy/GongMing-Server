
var app = require(__base + '/app.js');
var firebase = app.firebase;
var databaseRef = app.ref;
var bodyParser = app.bodyParser;

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
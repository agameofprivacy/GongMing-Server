
var app = require(__base + '/app.js');
var firebase = app.firebase;
var db = app.db;
var moment = app.moment;
var request = app.request;
var sunlightAPIKey = app.sunlightAPIKey;
var googleAPIKey = app.googleAPIKey;

exports.updateUserInfo = function(req, res){
    var requestParameters = req.body;
    return res.send({success:true, message:"default message"});
};

exports.loadLatestActiveCampaignForUser = function(req, res){
    var requestParameters = req.body;
    var uid = requestParameters.uid;
    var userInfoRef = db.ref("userInfo/" + uid);
    console.log("hello");
    userInfoRef.once("value", function(snapshot) {
        var districtString = snapshot.val()["currentDistrictState"] + "-" + snapshot.val()["currentDistrictNumber"];
        console.log("user district string is:" + districtString);
        var campaignRef = db.ref("campaign");
        campaignRef.orderByChild("active").equalTo(true).once("value", function(snapshot){
            console.log("snapshot has children of " + snapshot.numChildren());
            if (snapshot.numChildren() > 0) {
                var campaignExamined = 0;
                snapshot.forEach(function(campaign) {
                    for(var district in campaign.val()["districts"]){
                        console.log(":" + district);
                        if (district == districtString){
                            console.log("district matched: " + campaign.key);
                            return res.send({success:true, campaign:campaign.val(), campaignId:campaign.key});     
                        }
                    }
                    campaignExamined++;
                    if (campaignExamined == snapshot.numChildren()){
                        console.log("no district matched");
                        return res.send({success:false, message:"no active campaigns with applicable district coverage"});
                    }
                });

            }
            else{
                console.log("no active campaign");
                return res.send({success:false, message:"no active campaigns"});     
            }
        });
    });
};

exports.loadLatestActiveCampaignForLatLong = function(req, res){
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    getDistrictWithLatLong(latitude, longitude, function(data){
        if (data != "error"){
            var districtString = data["state"] + "-" + data["district"];
            console.log(districtString);
            var campaignRef = db.ref("campaign");
            campaignRef.orderByChild("active").equalTo(true).once("value", function(snapshot){
                console.log("snapshot has children of " + snapshot.numChildren());
                if (snapshot.numChildren() > 0) {
                    var campaignExamined = 0;
                    snapshot.forEach(function(campaign) {
                        for(var district in campaign.val()["districts"]){
                            console.log("latlong campaign district string is:" + district);
                            console.log("latlong district is: " + districtString);
                            if (district == districtString){
                                console.log("district matched: " + campaign.key);
                                return res.send({success:true, campaign:campaign.val(), campaignId:campaign.key});     
                            }
                        }     
                        campaignExamined++;
                        if (campaignExamined == snapshot.numChildren()){
                            console.log("no district matched");
                            return res.send({success:false, message:"no active campaigns with applicable district coverage"});
                        }

                    });
                }
                else{
                    console.log("no active campaign");
                    return res.send({success:false, message:"no active campaigns"});     
                }
            });
        }
        else{
        console.log(data);
        }
    });
};


exports.loadStoriesForCampaignBeforeTime = function(req, res){
    var campaignId = req.body.campaignId;
    var beforeTime = req.body.beforeTime;
    console.log(beforeTime);
    var storyRef = db.ref("story/" + campaignId);
    storyRef.orderByChild("date").endAt(beforeTime).limitToFirst(10).once("value", function(snapshot){
        console.log(snapshot.val());
        var noMoreStories;
        if (snapshot.numChildren() < 10){
            noMoreStories = true;
        }
        else{
            noMoreStories = false;
        }
        return res.send({success:true, message:"stories found", stories:snapshot.val(), noMoreStories:noMoreStories});
    });
};

exports.likeStory = function(req, res){
    var campaignId = req.body.campaignId;
    var storyId = req.body.storyId;
    var uid = req.body.uid;
    var storyRef = db.ref("story/" + campaignId + "/" + storyId);
    storyRef.once("value", function(storyRefSnapshot){
        // snapshot.ref.child("likedBy" + "/" + uid).set(true);
        // check if story is in userInfo's likedStories'
        var likedBefore;
        var action;
        var userInfoRef = db.ref("userInfo/" + uid);
        userInfoRef.once("value",function(userInfoSnapshot){
            var likedStoriesRef = userInfoSnapshot.ref.child("likedStories")
            likedStoriesRef.once("value", function(likedStoriesSnapshot){
                likedStoriesSnapshot.forEach(function(story) {
                    console.log("story is " + story.ref.key);
                    console.log("storyId is " + storyId);
                    if (story.ref.key == storyId){
                        story.ref.remove();
                        likedBefore = true;
                        action = "unliked";
                    }
                });
            });
            if (!likedBefore){
                
                // else, save story in userInfo's likedStories' and increment likeCount, and append to likedBy
                likedStoriesRef.child(storyId).set(true);
                console.log(storyRefSnapshot.val());

                var currentLikeCount = storyRefSnapshot.val()["likeCount"];
                action = "liked";
                console.log("new like" + currentLikeCount);
                storyRefSnapshot.ref.update({likeCount:currentLikeCount + 1});
                storyRefSnapshot.ref.child("likedBy").update({uid:true});
            }
            return res.send({success:true, message:"successfully liked or unliked", action:action});
        });
    });
};

exports.reportStory = function(req, res){
    var campaignId = req.body.campaignId;
    var storyId = req.body.storyId;
    var uid = req.body.uid;
    var storyRef = db.ref("story/" + campaignId + "/" + storyId);
    storyRef.once("value", function(snapshot){
        snapshot.ref.child("markedInappropriateBy" + "/" + uid).set(true); 
    });
    return res.send({success:true, message:"successfully reported"});
};

exports.recordSpeakout = function(req, res){
    var uid = req.body.uid;
    var campaignId = req.body.campaignId;
    var date = moment().unix();
    var userInfoRef = db.ref("userInfo/" + uid);
    userInfoRef.once("value",function(snapshot){
        var currentDistrictNumber = snapshot.val()["currentDistrictNumber"];
        var currentDistrictState = snapshot.val()["currentDistrictState"];
            var campaignSpeakoutsRef = db.ref("speakout/"+ campaignId);
        campaignSpeakoutsRef.orderByChild("author").equalTo(uid).once("value", function(snapshot){
            if (snapshot.numChildren() > 0){
                return res.send({success:false, message:"you already spoke out on this campaign"});
            }
            else{
                var userInfoRef = db.ref("userInfo/" + uid);
                userInfoRef.once("value", function(snapshot){
                    snapshot.child("speakoutCampaign/" + campaignId).ref.set(true);
                    var newSpeakout = campaignSpeakoutsRef.push();
                    newSpeakout.set({
                        "author":uid,
                        "date":date,
                        "currentDistrictNumber":currentDistrictNumber,
                        "currentDistrictState":currentDistrictState
                    });
                    var campaignRef = db.ref("campaign");
                    campaignRef.orderByKey().equalTo(campaignId).once("value", function(snapshot){
                        snapshot.forEach(function(campaign) {
                            for(var district in campaign.val()["districts"]){
                                if (district == currentDistrictState + "-" + currentDistrictNumber){
                                    return res.send({success:true, message:"speakout recorded", shouldPromptForStory:true});
                                }
                            }
                            return res.send({success:true, message:"speakout recorded", shouldPromptForStory:false});    
                        });
                    });

                });
            }
        });
    });

};

exports.submitStory = function(req, res){
    var authorId = req.body.authorId;
    var authorDisplayName = req.body.authorDisplayName;
    var date = req.body.date;
    var textNarrative = req.body.textNarrative;
    var campaignId = req.body.campaignId;
    var authorPhotoURL = req.body.authorPhotoURL;
    var authorCity = req.body.authorCity;
    var authorState = req.body.authorState;
    var storyRef = db.ref("story/" + campaignId);
    var newStory = storyRef.push();
    newStory.set({
        "authorId":authorId,
        "authorDisplayName":authorDisplayName,
        "date":date,
        "textNarrative":textNarrative,
        "authorPhotoURL":authorPhotoURL,
        "authorCity":authorCity,
        "authorState":authorState,
        "likeCount": 0
    });
    return res.send({success:true, message:"story saved", "storyId":newStory.key});
};

exports.loadCandidatesForEquality = function(req, res){
    return res.send({success:true, message:"default message"});
};

exports.loadIssues = function(req, res){
    return res.send({success:true, message:"default message"});
};

exports.updateStoryImageURLForStory = function(req, res){
    var storyId = req.body.storyId;
    var storyImageURL = req.body.storyImageURL;
    var campaignId = req.body.campaignId;
    var storyRef = db.ref("story/" + campaignId);
    storyRef.orderByKey().equalTo(storyId).once("value", function(snapshot){
        snapshot.ref.child(storyId).update({"storyImageURL":storyImageURL});
        return res.send({success:true, message:"story image url updated"});
    });

};

exports.updateStoryAudioURLForStory = function(req, res){
    var storyId = req.body.storyId;
    var storyAudioURL = req.body.storyAudioURL;
    var campaignId = req.body.campaignId;
    var storyRef = db.ref("story/" + campaignId);
    storyRef.orderByKey().equalTo(storyId).once("value", function(snapshot){
        snapshot.ref.child(storyId).update({"storyAudioURL":storyAudioURL});
        return res.send({success:true, message:"story audio url updated"});
    });
    
};

exports.getLegislatorInfoAndContactForUser = function(req, res){
    var uid = req.body.uid;
    var userInfoRef = db.ref("userInfo/" + uid);
    userInfoRef.once("value", function(snapshot){
        var currentLatitude = snapshot.val()["currentLatitude"];
        var currentLongitude = snapshot.val()["currentLongitude"];
        getLegislatorInfoWithLatLong(currentLatitude, currentLongitude, function(data){
            return res.send(data);
        });
    });
    
}

exports.getCandidatesForAddress = function(req, res){
    var address = req.body.address;
    getCandidatesForAddress(address, function(data){
        if (data != "error"){
            var candidatesList = [];
            var numberOfDivisionProcessed = 0;
            for (var i = 0; i < data["offices"].length; i++){
                var officeOCD = data["offices"][i]["divisionId"];
                var officeName = data["offices"][i]["name"];
                // console.log("office id: " + officeOCD);
                // console.log("office name: " + officeName);
                var candidatesRef = db.ref("candidate")
                candidatesRef.orderByChild("divisionId").equalTo(officeOCD).once("value", function(snapshot){
                console.log(officeName);
                    if (snapshot.numChildren() > 0) {
                        var candidateCount = 0
                        for (var i = 0; i < snapshot.numChildren(); i++){
                            console.log(snapshot.val());
                            var snapshotObject = snapshot.val();
                            for (var candidateObject in snapshotObject){
                                var candidate = snapshotObject[candidateObject];
                                if (candidate["officeName"] == this.officeName){
                                    candidatesList.push(candidate);
                                    console.log("candidate to add is " + candidate);
                                } 
                                candidateCount++;
                                if (candidateCount == snapshot.numChildren()){
                                    numberOfDivisionProcessed++;
                                    if (numberOfDivisionProcessed == data["offices"].length){
                                        console.log("candidates list is :" + candidatesList);
                                        res.send({success:true, candidatesList: candidatesList, message:"candidates are found"});
                                    }
                                }
                            }
                        }
                    }
                    else{
                        numberOfDivisionProcessed++;
                        if (numberOfDivisionProcessed == data["offices"].length){
                            console.log("candidates list is :" + candidatesList);
                            res.send({success:true, candidatesList: candidatesList, message:"candidates are found"});

                        }
                    }
                }, {officeName:officeName});

            }
            
        }
        else{
            res.send({success:false, message:"candidates are not found"});
        }
    });
}

function getCandidatesForAddress(address, callback){
  var url = "https://www.googleapis.com/civicinfo/v2/representatives?address=" + address + "&includeOffices=true&fields=offices(divisionId%2Cname%2Croles)&key=" + googleAPIKey;
    request(url, function(err, res, body) {
        if (!err && res.statusCode == 200) {
            var responseData = JSON.parse(body);
            console.log(url);
            callback(responseData);
        }
        else{
          console.log(url);
            console.log(err);
            callback("error");
        }
    });
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getLegislatorInfoWithLatLong(currentLatitude, currentLongitude, callback){
        var url = "http://congress.api.sunlightfoundation.com/legislators/locate?apikey=" + sunlightAPIKey;
        request(url + '&latitude=' + currentLatitude + '&longitude=' + currentLongitude, function(err, res, body) {
            if (!err && res.statusCode == 200) {
                var responseData = JSON.parse(body).results;
                if (responseData.length > 0){
                    var legislator = responseData[getRandomInt(0,responseData.length - 1)];
                    var legislatorName = legislator["first_name"] + " " + legislator["last_name"];
                    var legislatorTitle = legislator["title"];
                    var legislatorStateName = legislator["state_name"];
                    var legislatorDistrict = legislator["district"];
                    var chamberFullDictionry = {"senate":"U.S. Senate", "house":"U.S. House of Representatives"};
                    var legislatorChamber = chamberFullDictionry[legislator["chamber"]];
                    var legislatorDistrictString;
                    switch (legislatorDistrict) {
                        case null:
                            legislatorDistrictString = legislatorStateName + "";
                            break;
                        case 1:
                            legislatorDistrictString = legislatorStateName + "'s 1st District";
                            break;
                        case 2:
                            legislatorDistrictString = legislatorStateName + "'s 2nd District";
                            break;
                        case 3:
                            legislatorDistrictString = legislatorStateName + "'s 3rd District";
                            break;                    
                        default:
                            legislatorDistrictString = legislatorStateName + "'s " + legislatorDistrict + "th District";
                            break;
                    }
                    var legislatorNameString = legislatorTitle + " " + legislatorName;
                    var legislatorRoleString = legislatorChamber + ", " + legislatorDistrictString;
                    var legislatorPhotoURL = "https://theunitedstates.io/images/congress/450x550/" + legislator["bioguide_id"] + ".jpg";
                    var legislatorPhoneString = legislator["phone"];
                    callback({ success : true, message : 'legislator info delivered', legislatorNameString: legislatorNameString, legislatorRoleString:legislatorRoleString, legislatorPhotoURL:legislatorPhotoURL, legislatorPhoneString:legislatorPhoneString});
                }
            }
            else{
                console.log(err);
            }
        });


}

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

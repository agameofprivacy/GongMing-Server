
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
    userInfoRef.once("value", function(snapshot) {
        var districtString = snapshot.val()["currentDistrictState"] + "-" + snapshot.val()["currentDistrictNumber"];
        var campaignRef = db.ref("campaign");
        campaignRef.orderByChild("active").equalTo(true).once("value", function(snapshot){
            if (snapshot.numChildren() > 0) {
                var campaignExamined = 0;
                snapshot.forEach(function(campaign) {
                    for(var district in campaign.val()["districts"]){
                        if (district == districtString){
                            return res.send({success:true, campaign:campaign.val(), campaignId:campaign.key});     
                        }
                    }
                    campaignExamined++;
                    if (campaignExamined == snapshot.numChildren()){
                        return res.send({success:false, message:"no active campaigns with applicable district coverage"});
                    }
                });

            }
            else{
                return res.send({success:false, message:"no active campaigns"});     
            }
        });
    });
};

exports.loadLatestActiveCampaignForAddress = function (req, res){
    var address = encodeURIComponent(req.body.address);
    getOfficesForAddress(address, function(data){
        if (data != "error"){
            var normalizedAddress = data["normalizedInput"]["line1"] + ", " + data["normalizedInput"]["city"];
            var campaignsList = [];
            var numberOfDivisionProcessed = 0;
            var divisionsArray = [];
            for (var i = 0; i < data["offices"].length; i++){
                if (divisionsArray.indexOf(data["offices"][i]["divisionId"]) == -1){
                    divisionsArray.push(data["offices"][i]["divisionId"]);
                }
            }
            for (var i = 0; i < divisionsArray.length; i++){
                var officeOCD = divisionsArray[i];
                var campaignsRef = db.ref("campaign")
                campaignsRef.orderByChild("divisionId").equalTo(officeOCD).once("value", function(snapshot){
                    if (snapshot.numChildren() > 0) {
                        var campaignCount = 0
                        for (var i = 0; i < snapshot.numChildren(); i++){
                            var snapshotObject = snapshot.val();
                            for (var campaignObject in snapshotObject){
                                var campaign = snapshotObject[campaignObject];
                                console.log("campaign is :" + campaignObject);
                                campaign["key"] = campaignObject;
                                if (campaignsList.indexOf(campaign) == -1){
                                    campaignsList.push(campaign); 
                                }
                                campaignCount++;
                                if (campaignCount == snapshot.numChildren()){
                                    numberOfDivisionProcessed++;
                                    if (numberOfDivisionProcessed == divisionsArray.length){
                                        campaignsList = sortCampaignsByOfficeLevel(campaignsList, true);
                                        res.send({success:true, campaignsList: campaignsList, normalizedAddress:normalizedAddress, message:"candidates are found"});
                                    }
                                }
                            }
                        }
                    }
                    else{
                        numberOfDivisionProcessed++;
                        if (numberOfDivisionProcessed == divisionsArray.length){
                            campaignsList = sortCampaignsByOfficeLevel(campaignsList, true);
                            res.send({success:true, campaignsList: campaignsList, normalizedAddress:normalizedAddress, message:"candidates are found"});

                        }
                    }
                });

            }
            
        }
        else{
            res.send({success:false, message:"offices are not found"});
        }
    });
};

exports.loadLatestActiveCampaignForLatLong = function(req, res){
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    getDistrictWithLatLong(latitude, longitude, function(data){
        if (data != "error"){
            var districtString = data["state"] + "-" + data["district"];
            var campaignRef = db.ref("campaign");
            campaignRef.orderByChild("active").equalTo(true).once("value", function(snapshot){
                if (snapshot.numChildren() > 0) {
                    var campaignExamined = 0;
                    snapshot.forEach(function(campaign) {
                        for(var district in campaign.val()["districts"]){
                            if (district == districtString){
                                return res.send({success:true, campaign:campaign.val(), campaignId:campaign.key});     
                            }
                        }     
                        campaignExamined++;
                        if (campaignExamined == snapshot.numChildren()){
                            return res.send({success:false, message:"no active campaigns with applicable district coverage"});
                        }

                    });
                }
                else{
                    return res.send({success:false, message:"no active campaigns"});     
                }
            });
        }
        else{
        }
    });
};


exports.loadStoriesForCampaignBeforeTime = function(req, res){
    var campaignId = req.body.campaignId;
    var beforeTime = req.body.beforeTime;
    var initialLoad = req.body.initialLoad;
    var storyRef = db.ref("story/" + campaignId);
    var numStories = 10;
    if (initialLoad){
        numStories = numStories - 1;
    }
    
    storyRef.orderByChild("date").endAt(beforeTime).limitToLast(numStories + 1).once("value", function(snapshot){
        var noMoreStories;
        var stories;
        var storiesList = [];
        if (snapshot.numChildren() > 1){
            stories = snapshot.val();
            console.log(stories);
            if (!initialLoad){
                var index = 0;
                var indexToDelete;
                var keyOfStoryToDelete;
                for (var story in stories){
                    if (stories[story]["date"] == beforeTime){
                        keyOfStoryToDelete = story;
                        delete stories[keyOfStoryToDelete];
                    }
                    index++;
                }
            }
            if (stories.length < numStories + 1){
                noMoreStories = true;
            }
            else{
                noMoreStories = false;
            }
            console.log(stories);
            for (var story in stories){
                storiesList.push(stories[story]);
            }
            stories = sortStoriesByDate(storiesList, true);
            return res.send({success:true, message:"stories found", stories:stories, noMoreStories:noMoreStories});

        }
    else{
        return res.send({success:false, message:"no more stories found", stories:null, noMoreStories:true});
    }
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

                var currentLikeCount = storyRefSnapshot.val()["likeCount"];
                action = "liked";
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
    var address = req.body.address;
    var date = moment().unix();
    var userInfoRef = db.ref("userInfo/" + uid);
    userInfoRef.once("value",function(snapshot){
        var campaignSpeakoutsRef = db.ref("speakout/"+ campaignId);
        campaignSpeakoutsRef.orderByChild("author").equalTo(uid).once("value", function(snapshot){
            if (snapshot.numChildren() > 0){
                return res.send({success:false, message:"you already spoke out on this campaign"});
            }
            else{
                var userInfoRef = db.ref("userInfo/" + uid);
                userInfoRef.once("value", function(snapshot){
                    snapshot.child("speakoutCampaign/" + campaignId).ref.set(true);
                    snapshot.child("takeAddedCampaign/" + campaignId).ref.set(true);
                    var newSpeakout = campaignSpeakoutsRef.push();
                    // record most local divisionId that matches thoses listed in campaign
                    var campaignRef = db.ref("campaign/" + campaignId);
                    campaignRef.once("value", function(snapshot){
                        var campaign = snapshot.val();
                        var legislatorOffices = campaign["legislatorOffices"];
                        var mostLocalDivisionId = "";
                        getOfficesForAddress(address, function(data){
                            var offices = data["offices"];
                            var city = data["normalizedInput"]["city"];
                            var state = data["normalizedInput"]["state"];
                            for (var office in offices){
                                console.log("office[divisionId] in offices is " + office["divisionId"]);
                                var divisionId = office["divisionId"]
                                for (var key in legislatorOffices){
                                    console.log("key in legislatorOffices is " + key);
                                    if (divisionId == key && divisionId.length > mostLocalDivisionId.length){
                                        mostLocalDivisionId = divisionId;
                                    }
                                } 
                            }
                            if (mostLocalDivisionId != ""){
                                newSpeakout.set({
                                    "author":uid,
                                    "date":date,
                                    "divisionId":mostLocalDivisionId
                                });
                                return res.send({success:true, message:"speakout recorded", shouldPromptForStory:true, divisionId:mostLocalDivisionId, city:city, state:state});
                            }
                            else{
                                return res.send({success:true, message:"speakout recorded", shouldPromptForStory:false});    
                            }
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


exports.loadIssuesForAddress = function(req, res){
    var address = encodeURIComponent(req.body.address);
    getCandidatesForAddress(address, function(data){
        if (data != "error"){
            var normalizedAddress = data["normalizedInput"]["line1"] + ", " + data["normalizedInput"]["city"];

            var issuesList = [];
            var numberOfDivisionProcessed = 0;
            var searchOffice = [];
            for (var i = 0; i < data["offices"].length; i++){
                if (searchOffice.indexOf(data["offices"][i]["divisionId"]) == -1){
                    searchOffice.push(data["offices"][i]["divisionId"]);
                }
            }
            for (var i = 0; i < searchOffice.length; i++){
                var officeOCD = searchOffice[i];
                var issuesRef = db.ref("issue")
                issuesRef.orderByChild("divisionId").equalTo(officeOCD).once("value", function(snapshot){
                    if (snapshot.numChildren() > 0) {
                        var issueCount = 0
                        var snapshotObject = snapshot.val();
                        for (var issueObject in snapshotObject){
                            var issue = snapshotObject[issueObject];
                            issuesList.push(issue);
                            issueCount++;
                            if (issueCount == snapshot.numChildren()){
                                numberOfDivisionProcessed++;
                                if (numberOfDivisionProcessed == searchOffice.length){
                                    res.send({success:true, issuesList: issuesList, normalizedAddress:normalizedAddress, message:"issues are found"});
                                }
                            }
                        }
                    }
                    else{
                        numberOfDivisionProcessed++;
                        if (numberOfDivisionProcessed == searchOffice.length){
                            res.send({success:true, issuesList: issuesList, normalizedAddress:normalizedAddress, message:"issues are found"});

                        }
                    }
                });
            }
        }
        else{
            res.send({success:false, message:"issues are not found"});
        }
    });
}

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
    var address = encodeURIComponent(req.body.address);
    getCandidatesForAddress(address, function(data){
        if (data != "error"){
            var normalizedAddress = data["normalizedInput"]["line1"] + ", " + data["normalizedInput"]["city"];
            var candidatesList = [];
            var numberOfDivisionProcessed = 0;
            for (var i = 0; i < data["offices"].length; i++){
                var officeOCD = data["offices"][i]["divisionId"];
                var officeName = data["offices"][i]["name"];
                var candidatesRef = db.ref("candidate")
                candidatesRef.orderByChild("divisionId").equalTo(officeOCD).once("value", function(snapshot){
                    if (snapshot.numChildren() > 0) {
                        var candidateCount = 0
                        for (var i = 0; i < snapshot.numChildren(); i++){
                            var snapshotObject = snapshot.val();
                            for (var candidateObject in snapshotObject){
                                var candidate = snapshotObject[candidateObject];
                                if (candidate["officeName"] == this.officeName){
                                    candidatesList.push(candidate);
                                } 
                                candidateCount++;
                                if (candidateCount == snapshot.numChildren()){
                                    numberOfDivisionProcessed++;
                                    if (numberOfDivisionProcessed == data["offices"].length){
                                        candidatesList = sortCandidatesByOfficeLevel(candidatesList, true);
                                        res.send({success:true, candidatesList: candidatesList, normalizedAddress:normalizedAddress, message:"candidates are found"});
                                    }
                                }
                            }
                        }
                    }
                    else{
                        numberOfDivisionProcessed++;
                        if (numberOfDivisionProcessed == data["offices"].length){
                            candidatesList = sortCandidatesByOfficeLevel(candidatesList, true);
                            res.send({success:true, candidatesList: candidatesList, normalizedAddress:normalizedAddress, message:"candidates are found"});

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

exports.loadLegislatorForCampaignIdWithDivisionId = function(req, res){
    var campaignId = req.body.campaignId;
    var divisionId = req.body.divisionId;
    getLegislatorInfoForCampaignIdAndDivisionId(campaignId, divisionId, function(legislator, office){
        if (legislator != "error"){
            var legislatorNameString = legislator["name"];
            var legislatorRoleString = office["name"];
            var legislatorPhotoURL = legislator["photoUrl"];
            var legislatorPhoneString = legislator["phones"][0];
            callback({ success : true, message : 'legislator info delivered', legislatorNameString: legislatorNameString, legislatorRoleString:legislatorRoleString, legislatorPhotoURL:legislatorPhotoURL, legislatorPhoneString:legislatorPhoneString});
        }
        else{
            res.send()
        }
    });
}

function getCandidatesForAddress(address, callback){
  var url = "https://www.googleapis.com/civicinfo/v2/representatives?address=" + address + "&includeOffices=true&fields=offices(divisionId%2Cname%2Croles)%2CnormalizedInput&key=" + googleAPIKey;
    request(url, function(err, res, body) {
        if (!err && res.statusCode == 200) {
            var responseData = JSON.parse(body);
            callback(responseData);
        }
        else{
            console.log("error from google is :" + err + "and status message is :" + res.statusMessage);
            callback("error");
        }
    });
}

function getOfficesForAddress(address, callback){
    var url = "https://www.googleapis.com/civicinfo/v2/representatives?address=" + address + "&includeOffices=true&fields=normalizedInput%2Coffices(divisionId%2Cname)&key=" + googleAPIKey;
    request(url, function(err, res, body) {
        if (!err && res.statusCode == 200) {
            var responseData = JSON.parse(body);
            callback(responseData);
        }
        else{
            console.log("error from google is :" + err + "and status message is :" + res.statusMessage);
            callback("error");
        }
    });
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getLegislatorInfoForCampaignId(campaignId, callback){
    var campaignRef = db.ref("campaign/" + campaignId)
    campaignRef.once("value", function(snapshot){
        var campaign = snapshot.val();
        var legislatorOffices = campaign["legislatorOffices"];
        var randomInt = getRandomInt(0, legislatorOffices.length - 1);
        legislatorOffice = legislatorOffices[randomInt];
        console.log(legislatorOffice);
    });
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
            callback(responseData);
        }
        else{
            console.log(err);
            callback("error");
        }
    });

};


function sortCandidatesByOfficeLevel(candidatesList, desc){
    // var candidatesArray = [];
    // for (var candidate in candidatesList){
    //     candidatesArray.push(candidatesList[candidate]);
    // }
    // console.log(candidatesArray);
    candidatesList.sort(function(a, b){
        return a.divisionId.length - b.divisionId.length;
    });
    return candidatesList;
}

function sortCampaignsByOfficeLevel(campaignsList, desc){
    // var candidatesArray = [];
    // for (var candidate in candidatesList){
    //     candidatesArray.push(candidatesList[candidate]);
    // }
    // console.log(candidatesArray);
    campaignsList.sort(function(a, b){
        return b.divisionId.length - a.divisionId.length;
    });
    return campaignsList;
}


function sortStoriesByDate(stories, desc){
    // var candidatesArray = [];
    // for (var candidate in candidatesList){
    //     candidatesArray.push(candidatesList[candidate]);
    // }
    // console.log(candidatesArray);
    stories.sort(function(a, b){
        return b.date - a.date;
    });
    return stories;
}


function getLegislatorInfoForCampaignIdAndDivisionId(campaignId, divisionId, callback){
    var campaignRef = db.ref("campaign/" + campaignId)
    campaignRef.once("value", function(snapshot){
        var campaign = snapshot.val();
        var legislatorOffices = campaign["legislatorOffices"];
        getRandomLegislatorForDivisionId(divisionId, function(legislator, office){
            if (legislator != "error"){
                console.log("random legislator is " + legislator["name"]);
                callback(legislator, office);
            }
            else{
                console.log("error");
            }
        });
    });
}

function getRandomLegislatorForDivisionId(divisionId, callback){
  var divisionId = encodeURIComponent(divisionId);
  var url = "https://www.googleapis.com/civicinfo/v2/representatives/" + divisionId + "?key=" + googleAPIKey; 
    request(url, function(err, res, body) {
        if (!err && res.statusCode == 200) {
            var responseData = JSON.parse(body);
            var officials = responseData["officials"];
            var offices = responseData["offices"];
            var randomInt = getRandomInt(0, Object.keys(officials).length - 1);
            var randomOfficial = officials[randomInt];
            var randomOffice = offices[randomInt];
            callback(randomOfficial, randomOffice);
        }
        else{
            console.log("error from google is :" + err + "and status message is :" + res.statusMessage);
            callback("error");
        }
    });

}
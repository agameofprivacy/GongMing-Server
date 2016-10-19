
var app = require(__base + '/app.js');
var firebase = app.firebase;
var db = app.db;
var moment = app.moment;
var request = app.request;
var sunlightAPIKey = app.sunlightAPIKey;
var googleAPIKey = app.googleAPIKey;
var clientAPIKey = "UrXi59rCjB7wBMU6hF1l6oTdyfKCzw5C06l7IASEPtKCAMHV8ZQxjeX3BXOwEpa";

exports.loadLatestActiveCampaignForAddress = function (req, res){
    if (req.body.clientAPIKey == clientAPIKey){
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
                            var snapshotObject = snapshot.val();
                            for (var campaignObject in snapshotObject){
                                var campaign = snapshotObject[campaignObject];
                                campaign["key"] = campaignObject;
                                if (campaignsList.indexOf(campaign) == -1 && campaign["active"]){
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
    }
    else{
        res.send({success:false, message:"clientAPIKey invalid"});
    } 
    
};

exports.loadStoriesForCampaignBeforeTime = function(req, res){
    if (req.body.clientAPIKey == clientAPIKey){
        var campaignId = req.body.campaignId;
        var beforeTime = req.body.beforeTime;
        var initialLoad = req.body.initialLoad;
        var sortMethod = req.body.sortMethod;
        var lastStoryId = req.body.lastStoryId;
        var storyRef = db.ref("story/" + campaignId);

        var numStories = 10;
        var noMoreStories;
        var stories;
        var storiesList = [];

        var topStory;
        storyRef.orderByChild("likeCount").limitToLast(1).once("value", function(snapshot){
            if (snapshot.numChildren() > 0){
                for (var story in snapshot.val()){
                    topStory = snapshot.val();
                }
                if (stories != null){
                    return res.send({success:true, message:"stories found", stories:storiesList, noMoreStories:noMoreStories, topStory:topStory});
                }
            }
            else{
                if (stories != null){
                    return res.send({success:true, message:"stories found", stories:storiesList, noMoreStories:noMoreStories, topStory:null});
                }
            }
        });
        if (sortMethod == "Recent"){
            if (lastStoryId != null){
                storyRef.orderByKey().endAt(lastStoryId).limitToLast(numStories + 1).once("value", function(snapshot){
                    if (snapshot.numChildren() > 0){
                        stories = snapshot.val();
                        if (snapshot.numChildren() < numStories + 1){
                            noMoreStories = true;
                        }
                        else{
                            noMoreStories = false;
                        }
                        for (var story in stories){
                            var storyToPush = stories[story]
                            storyToPush["key"] = story;
                            storiesList.push(storyToPush);
                        }
                        storiesList = storiesList.reverse();
                        storiesList.shift();
                        if (topStory != null){ 
                            return res.send({success:true, message:"stories found", stories:storiesList, noMoreStories:noMoreStories, topStory:topStory});
                        }   
                    }
                    else{
                        return res.send({success:true, message:"no more stories found", stories:null, noMoreStories:true, topStory:null});
                    }
                });
            }
            else{
                storyRef.limitToLast(numStories).once("value", function(snapshot){
                    if (snapshot.numChildren() > 0){
                        stories = snapshot.val();
                        
                        if (snapshot.numChildren() < numStories){
                            noMoreStories = true;
                        }
                        else{
                            noMoreStories = false;
                        }
                        for (var story in stories){
                            var storyToPush = stories[story]
                            storyToPush["key"] = story;
                            storiesList.push(storyToPush);
                        }
                        if (topStory != null){ 
                            return res.send({success:true, message:"stories found", stories:storiesList.reverse(), noMoreStories:noMoreStories, topStory:topStory});
                        }   
                    }
                    else{
                        return res.send({success:true, message:"no more stories found", stories:null, noMoreStories:true, topStory:null});
                    }
                });
            }
        }
        else{
            storyRef.orderByChild("likeCount").limitToLast(100).once("value", function(snapshot){
                if (snapshot.numChildren() > 0){
                    stories = snapshot.val();
                    for (var story in stories){
                        var storyToPush = stories[story]
                        storyToPush["key"] = story;
                        storiesList.push(storyToPush);
                    }
                    storiesList = sortStoriesByLikeCount(storiesList, true);
                    if (topStory != null){ 
                        return res.send({success:true, message:"stories found", stories:storiesList, noMoreStories:true, topStory:topStory});
                    }
                }
            else{
                return res.send({success:true, message:"no more stories found", stories:null, noMoreStories:true, topStory:null});
            }
            });

        }
    }
    else{
        res.send({success:false, message:"clientAPIKey invalid"});
    }

};

exports.likeStory = function(req, res){
    var campaignId = req.body.campaignId;
    var storyId = req.body.storyId;
    var uid = req.body.uid;
    var idToken = req.body.idToken;
    firebase.auth().verifyIdToken(idToken).then(function(decodedToken) {
        if (uid == decodedToken.uid){
            var storyRef = db.ref("story/" + campaignId + "/" + storyId);
            storyRef.once("value", function(storyRefSnapshot){
                // snapshot.ref.child("likedBy" + "/" + uid).set(true);
                // check if story is in userInfo's likedStories'
                var likedBefore;
                var userInfoRef = db.ref("userInfo/" + uid);
                var action = "";
                userInfoRef.once("value",function(userInfoSnapshot){
                    var likedStoriesRef = userInfoSnapshot.ref.child("likedStories")
                    likedStoriesRef.once("value", function(likedStoriesSnapshot){
                        if (likedStoriesSnapshot.numChildren() > 0){
                            var index = 0;
                            for (var storyKey in likedStoriesSnapshot.val()){
                                index++;
                                var story = likedStoriesSnapshot.val()[storyKey];
                                if (storyKey == storyId){
                                    likedStoriesRef.child(storyKey).remove();
                                    likedBefore = true;
                                    action = "unliked";
                                    return res.send({success:true, message:"successfully unliked", action:action});
                                }
                                console.log("index is " + index);
                                if (index == likedStoriesSnapshot.numChildren()){
                                    if (!likedBefore){
                                        action = "liked";
                                        // else, save story in userInfo's likedStories' and increment likeCount, and append to likedBy
                                        likedStoriesRef.child(storyId).set(true);
                                        var currentLikeCount = storyRefSnapshot.val()["likeCount"];
                                        storyRefSnapshot.ref.update({likeCount:currentLikeCount + 1});
                                        console.log("uid of liker is " + uid);
                                        storyRefSnapshot.ref.child("likedBy/" + uid).set(true);
                                        // record user activtiy in client user
                                        var likerActivityRef = db.ref("userActivity/" + uid);
                                        var newActivity = likerActivityRef.push();
                                        var storyAuthorId = req.body.storyAuthorId;
                                        var storyAuthorDisplayName = req.body.storyAuthorDisplayName;
                                        var campaignGeoTitle = req.body.campaignGeoTitle;
                                        var campaignFullTitle = req.body.campaignFullTitle;

                                        newActivity.set({
                                            action:"like"                    
                                        });
                                        newActivity.child("storyAuthorId").set(storyAuthorId);
                                        newActivity.child("storyAuthorDisplayName").set(storyAuthorDisplayName);
                                        newActivity.child("storyId").set(storyId);
                                        newActivity.child("campaignGeoTitle").set(campaignGeoTitle);
                                        newActivity.child("campaignFullTitle").set(campaignFullTitle);
                                        newActivity.child("date").set((new Date).getTime()/1000);
                                        
                                        var receiverActivityRef = db.ref("userActivity/" + storyAuthorId);
                                        var newReceiverActivity = receiverActivityRef.push();
                                        var likerDisplayName = req.body.likerDisplayName;
                                        newReceiverActivity.set({
                                            action:"liked"
                                        });
                                        newReceiverActivity.child("likerId").set(uid);
                                        newReceiverActivity.child("likerDisplayName").set(likerDisplayName);
                                        newReceiverActivity.child("storyId").set(storyId);
                                        newReceiverActivity.child("campaignGeoTitle").set(campaignGeoTitle);
                                        newReceiverActivity.child("campaignFullTitle").set(campaignFullTitle);
                                        newReceiverActivity.child("date").set((new Date).getTime()/1000);
                                    }
                                    
                                    return res.send({success:true, message:"successfully liked or unliked", action:action});
                                }
                            } 
                        }
                        else{
                            action = "liked";
                            // else, save story in userInfo's likedStories' and increment likeCount, and append to likedBy
                            likedStoriesRef.child(storyId).set(true);
                            var currentLikeCount = storyRefSnapshot.val()["likeCount"];
                            storyRefSnapshot.ref.update({likeCount:currentLikeCount + 1});
                            console.log("uid of liker is " + uid);
                            storyRefSnapshot.ref.child("likedBy/" + uid).set(true);
                            // record user activtiy in client user
                            var likerActivityRef = db.ref("userActivity/" + uid);
                            var newActivity = likerActivityRef.push();
                            var storyAuthorId = req.body.storyAuthorId;
                            var storyAuthorDisplayName = req.body.storyAuthorDisplayName;
                            var campaignGeoTitle = req.body.campaignGeoTitle;
                            var campaignFullTitle = req.body.campaignFullTitle;
                            newActivity.set({
                                action:"like"                    
                            });
                            newActivity.child("storyAuthorId").set(storyAuthorId);
                            newActivity.child("storyAuthorDisplayName").set(storyAuthorDisplayName);
                            newActivity.child("campaignGeoTitle").set(campaignGeoTitle);
                            newActivity.child("campaignFullTitle").set(campaignFullTitle);
                            newActivity.child("date").set((new Date).getTime()/1000);
                        }
                        
                    });
                });
            });
        }
        else{
            console.log("token invalid");
            return res.send({success:false, message:"user token invalid"});
        }
    }).catch(function(error) {
    // Handle error
        console.log(error);
    });

    // record user activity in story author user
};

exports.reportStory = function(req, res){
    var campaignId = req.body.campaignId;
    var storyId = req.body.storyId;
    var uid = req.body.uid;
    var idToken = req.body.idToken;
    firebase.auth().verifyIdToken(idToken).then(function(decodedToken) {
        if (uid == decodedToken.uid){
            var storyRef = db.ref("story/" + campaignId + "/" + storyId);
            storyRef.once("value", function(snapshot){
                snapshot.ref.child("markedInappropriateBy" + "/" + uid).set(true); 
            });
            return res.send({success:true, message:"successfully reported"});
        }
        else{
            console.log("token invalid");
            return res.send({success:false, message:"user token invalid"});
        }
    });
};

exports.recordSpeakout = function(req, res){
    var uid = req.body.uid;
    var idToken = req.body.idToken;
    firebase.auth().verifyIdToken(idToken).then(function(decodedToken) {
        if (uid == decodedToken.uid){
            var campaignId = req.body.campaignId;
            var address = encodeURIComponent(req.body.address);
            var date = (new Date).getTime()/1000;
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
                                        console.log("office in offices is " + offices[office]);
                                        var divisionId = offices[office]["divisionId"]
                                        for (var key in legislatorOffices){
                                            // console.log("key in legislatorOffices is " + key);
                                            console.log("divisionId is " + divisionId);
                                            console.log("legislatorOffice divisionId is " + legislatorOffices[key]);
                                            if (divisionId == legislatorOffices[key] && divisionId.length > mostLocalDivisionId.length){
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
                                        userInfoRef.update({
                                            divisionId:mostLocalDivisionId,
                                            city:city,
                                            state:state
                                        });
                                        userInfoRef.child("eligibleForTakeOnCampaign/" + campaignId).ref.set(true);
                                        return res.send({success:true, message:"speakout recorded", shouldPromptForStory:true, divisionId:mostLocalDivisionId, city:city, state:state});
                                    }
                                    else{
                                        return res.send({success:true, message:"speakout recorded", shouldPromptForStory:false});    
                                    }
                                });
                            });
                        });
                        var userActivityRef = db.ref("userActivity/" + uid);
                        var newSpeakoutActivity = userActivityRef.push();
                        var position = req.body.position;
                        var campaignGeoTitle = req.body.campaignGeoTitle;
                        var campaignFullTitle = req.body.campaignFullTitle;
                        newSpeakoutActivity.set({
                            action:"speakout"
                        });
                        newSpeakoutActivity.child("campaignId").set(campaignId);
                        newSpeakoutActivity.child("campaignGeoTitle").set(campaignGeoTitle);
                        newSpeakoutActivity.child("campaignFullTitle").set(campaignFullTitle);
                        newSpeakoutActivity.child("position").set(position);
                        newSpeakoutActivity.child("date").set((new Date).getTime()/1000);
                    }
                });
            });
        }
        else{
            console.log("token invalid");
            return res.send({success:false, message:"user token invalid"});
        }
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
    var uid = req.body.uid;
    var idToken = req.body.idToken;
    firebase.auth().verifyIdToken(idToken).then(function(decodedToken) {
        if (uid == decodedToken.uid){
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
            var userInfoRef = db.ref("userInfo/" + authorId);
            userInfoRef.child("takeAddedCampaign/" + campaignId).set(true);
            return res.send({success:true, message:"story saved", "storyId":newStory.key});
        }
        else{
            console.log("token invalid");
            return res.send({success:false, message:"user token invalid"});
        }
    });

};


exports.loadIssuesForAddress = function(req, res){
    if (req.body.clientAPIKey == clientAPIKey){
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
    else{
        res.send({success:false, message:"clientAPIKey invalid"});
    }
    
}

exports.updateStoryImageURLForStory = function(req, res){
    var uid = req.body.uid;
    var idToken = req.body.idToken;
    firebase.auth().verifyIdToken(idToken).then(function(decodedToken) {
        if (uid == decodedToken.uid){
            var storyId = req.body.storyId;
            var storyImageURL = req.body.storyImageURL;
            var campaignId = req.body.campaignId;
            var storyRef = db.ref("story/" + campaignId);
            storyRef.orderByKey().equalTo(storyId).once("value", function(snapshot){
                snapshot.ref.child(storyId).update({"storyImageURL":storyImageURL});
                return res.send({success:true, message:"story image url updated"});
            });
        }
        else{
            console.log("token invalid");
            return res.send({success:false, message:"user token invalid"});
        }
    });

};

exports.updateStoryAudioURLForStory = function(req, res){
    var uid = req.body.uid;
    var idToken = req.body.idToken;
    firebase.auth().verifyIdToken(idToken).then(function(decodedToken) {
        if (uid == decodedToken.uid){
            var storyId = req.body.storyId;
            var storyAudioURL = req.body.storyAudioURL;
            var campaignId = req.body.campaignId;
            var storyRef = db.ref("story/" + campaignId);
            storyRef.orderByKey().equalTo(storyId).once("value", function(snapshot){
                snapshot.ref.child(storyId).update({"storyAudioURL":storyAudioURL});
                return res.send({success:true, message:"story audio url updated"});
            });
        }
        else{
            console.log("token invalid");
            return res.send({success:false, message:"user token invalid"});
        }
    });
};

exports.getCandidatesForAddress = function(req, res){
    if (req.body.clientAPIKey == clientAPIKey){
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
    else{
        res.send({success:false, message:"clientAPIKey invalid"});
    }
    
}

exports.loadLegislatorForCampaignIdWithDivisionId = function(req, res){
    if (req.body.clientAPIKey == clientAPIKey){
        var campaignId = req.body.campaignId;
        var divisionId = req.body.divisionId;
        getLegislatorInfoForCampaignIdAndDivisionId(campaignId, divisionId, function(legislator, office){
            if (legislator != "error"){
                var legislatorNameString = legislator["name"];
                var legislatorRoleString = office["name"];
                var legislatorPhotoURL = legislator["photoUrl"];
                var legislatorPhoneString = legislator["phones"][0];
                console.log(legislatorPhoneString);
                res.send({ success : true, message : 'legislator info delivered', legislatorNameString: legislatorNameString, legislatorRoleString:legislatorRoleString, legislatorPhotoURL:legislatorPhotoURL, legislatorPhoneString:legislatorPhoneString});
            }
            else{
                res.send({success : false, message:"error finding legislator info"})
            }
        });
    }
    else{
        res.send({success:false, message:"clientAPIKey invalid"});
    }
    
}

exports.loadActivities = function(req, res){
    var uid = req.body.uid;
    var idToken = req.body.idToken;
    firebase.auth().verifyIdToken(idToken).then(function(decodedToken) {
        if (uid == decodedToken.uid){
            var filter = req.body.filter;
            var userActivityRef = db.ref("userActivity/" + uid);
            var activitiesList = [];
            if (filter == "All"){ 
                userActivityRef.once("value", function(activitiesSnapshot){
                    if (activitiesSnapshot.numChildren() > 0){
                        var activities = activitiesSnapshot.val(); 
                        for (var activity in activities){
                            var activityToPush = activities[activity]
                            activityToPush["key"] = activity;
                            activitiesList.push(activityToPush);
                        }

                        activities = sortActivitiesByDate(activitiesList, true);
                        res.send({success:true, message:"activities found", activities:activities});
                    }
                    else{
                        res.send({success:true, message:"no activity found"});
                    }
                });
            }
            else{
                userActivityRef.orderByChild("action").equalTo("speakout").once("value", function(activitiesSnapshot){
                    if (activitiesSnapshot.numChildren() > 0){
                        var activities = activitiesSnapshot.val(); 
                        for (var activity in activities){
                            var activityToPush = activities[activity]
                            activityToPush["key"] = activity;
                            activitiesList.push(activityToPush);
                        }
                        activities = sortActivitiesByDate(activitiesList, true);
                        res.send({success:true, message:"activities found", activities:activities});
                    }
                    else{
                        res.send({success:true, message:"no activity found"});
                    }
                });
            }
        }
        else{
            console.log("token invalid");
            return res.send({success:false, message:"user token invalid"});
        }
    });
    

}
// exports.loadCampaignsForIssue = function(req, res){

// };

exports.loadOrganizationsForAddress = function(req, res){
    if (req.body.clientAPIKey == clientAPIKey){
        var address = encodeURIComponent(req.body.address);
        getOfficesForAddress(address, function(data){
            if (data != "error"){
                var normalizedAddress = data["normalizedInput"]["line1"] + ", " + data["normalizedInput"]["city"];
                var organizationsList = [];
                var numberOfDivisionProcessed = 0;
                var divisionsArray = [];
                for (var i = 0; i < data["offices"].length; i++){
                    if (divisionsArray.indexOf(data["offices"][i]["divisionId"]) == -1){
                        divisionsArray.push(data["offices"][i]["divisionId"]);
                    }
                }
                for (var i = 0; i < divisionsArray.length; i++){
                    var officeOCD = divisionsArray[i];
                    var organizationsRef = db.ref("organization")
                    organizationsRef.orderByChild("divisionId").equalTo(officeOCD).once("value", function(snapshot){
                        if (snapshot.numChildren() > 0) {
                            var organizationCount = 0
                            var snapshotObject = snapshot.val();
                            for (var organizationObject in snapshotObject){
                                var organization = snapshotObject[organizationObject];
                                if (organizationsList.indexOf(organization) == -1){
                                    organizationsList.push(organization); 
                                }
                                organizationCount++;
                                if (organizationCount == snapshot.numChildren()){
                                    numberOfDivisionProcessed++;
                                    if (numberOfDivisionProcessed == divisionsArray.length){
                                        organizationsList = sortOrganizationsByDivisionIdLevel(organizationsList, true);
                                        res.send({success:true, organizationsList: organizationsList, normalizedAddress:normalizedAddress, message:"organizations are found"});
                                    }
                                }
                            }
                        }
                        else{
                            numberOfDivisionProcessed++;
                            if (numberOfDivisionProcessed == divisionsArray.length){
                                organizationsList = sortOrganizationsByDivisionIdLevel(organizationsList, true);
                                res.send({success:true, organizationsList: organizationsList, normalizedAddress:normalizedAddress, message:"organizations are found"});

                            }
                        }
                    });

                }
                
            }
            else{
                res.send({success:false, message:"organizations are not found"});
            }
        });
    }
    else{
        res.send({success:false, message:"clientAPIKey invalid"});
    }

};

exports.deleteAccountWithId = function(req, res){
    var uid = req.body.uid;
    var idToken = req.body.idToken;
    firebase.auth().verifyIdToken(idToken).then(function(decodedToken) {
        if (uid == decodedToken.uid){
            var userInfoRef = db.ref("userInfo/" + uid);
            userInfoRef.update({requestedAccountDeletion:true});
            return res.send({success:true, message:"account deletion requested"});
        }
        else{
            console.log("token invalid");
            return res.send({success:false, message:"user token invalid"});
        }
    });
};

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
    var url = "https://www.googleapis.com/civicinfo/v2/representatives?address=" + address + "&includeOffices=true&fields=normalizedInput%2Coffices&key={YOUR_API_KEY}";
    var url = "https://www.googleapis.com/civicinfo/v2/representatives?address=" + address + "&includeOffices=true&fields=offices(divisionId%2Cname)%2CnormalizedInput&key=" + googleAPIKey;
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

function sortCandidatesByOfficeLevel(candidatesList, desc){
    candidatesList.sort(function(a, b){
        return a.divisionId.length - b.divisionId.length;
    });
    return candidatesList;
}

function sortOrganizationsByDivisionIdLevel(organizationsList, desc){
    organizationsList.sort(function(a, b){
        return b.divisionId.length - a.divisionId.length;
    });
    return organizationsList;
}

function sortCampaignsByOfficeLevel(campaignsList, desc){
    campaignsList.sort(function(a, b){
        return b.divisionId.length - a.divisionId.length;
    });
    return campaignsList;
}

function sortActivitiesByDate(activities, desc){
    activities.sort(function(a, b){
        return b.date - a.date;
    });
    return activities;
}



function sortStoriesByDate(stories, desc){
    stories.sort(function(a, b){
        return b.date - a.date;
    });
    return stories;
}

function sortStoriesByLikeCount(stories, desc){
    stories.sort(function(a, b){
        return b.likeCount - a.likeCount;
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

function doesIdTokenMatchUID(idToken, uid){
    console.log("idToken is " + idToken);
    console.log("uid is " + uid);


}
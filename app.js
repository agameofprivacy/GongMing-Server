
global.__base = __dirname + '/';

var sunlightAPIKey = "5503cb1366e0492a9be0c6e496cff1b8";
var googleAPIKey = "AIzaSyAZKvdt75J85k7J5dB8Je42U9wt7aI_az4";
var request = require('request');
var moment = require('moment');
exports.sunlightAPIKey = sunlightAPIKey;
exports.moment = moment;
exports.request = request;
exports.googleAPIKey = googleAPIKey;

var firebase = require('firebase');
exports.firebase = firebase;

firebase.initializeApp({
  databaseURL: 'https://speakout-9d07b.firebaseio.com',
  serviceAccount: './speakoutServiceAccount.json',
  databaseAuthVariableOverride: {
    uid: "my-service-worker"
  }
});

var db = firebase.database();
exports.db = db;

// listen for change in userInfo > uid > currentLatitude, then update congressional district info for said userInfo
// var userInfoRef = db.ref("userInfo");
// userInfoRef.on("child_changed", function(snapshot) {
//   console.log(snapshot.val());
//   var userInfo = snapshot.val();
//   var currentLatitude = userInfo["currentLatitude"];
//   var currentLongitude = userInfo["currentLongitude"];
//   getDistrictWithLatLong(currentLatitude, currentLongitude, function(data){
//     if (data != "error"){
//       snapshot.ref.update({"currentDistrictNumber":data["district"], "currentDistrictState":data["state"]});
//     }
//     else{
//       console.log(data);
//     }
//   });
// }, function (errorObject) {
//    console.log("The read failed: " + errorObject.code);
// });

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

app.post('/loadLatestActiveCampaignForAddress', speakoutRoutes.loadLatestActiveCampaignForAddress);
app.post('/loadStoriesForCampaignBeforeTime', speakoutRoutes.loadStoriesForCampaignBeforeTime);
app.post('/likeStory', speakoutRoutes.likeStory);
app.post('/reportStory', speakoutRoutes.reportStory);
app.post('/recordSpeakout', speakoutRoutes.recordSpeakout);
app.post('/submitStory', speakoutRoutes.submitStory);
app.post('/loadIssuesForAddress', speakoutRoutes.loadIssuesForAddress);
app.post('/updateStoryImageURLForStory', speakoutRoutes.updateStoryImageURLForStory);
app.post('/updateStoryAudioURLForStory', speakoutRoutes.updateStoryAudioURLForStory);
app.post('/getCandidatesForAddress', speakoutRoutes.getCandidatesForAddress);
app.post('/loadLegislatorForCampaignIdWithDivisionId', speakoutRoutes.loadLegislatorForCampaignIdWithDivisionId);
app.post('/loadActivities', speakoutRoutes.loadActivities);
app.post('/loadOrganizationsForAddress', speakoutRoutes.loadOrganizationsForAddress);
// app.post('/loadCampaignsForIssue', speakoutRoutes.loadCampaignsForIssue);
var server = app.listen(process.env.PORT || '8080', function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});





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


// addDupStoriesToCampaignWithId("-KSWfR6vOhizHMX4YUZ7");
// setStoryWithDemoContent();

// add campaign to issue
// var issueCampaignsRef = db.ref("issue/" + "-KUDibIYgJsy3qUGUg92/" + "campaigns");
// var newCampaign = issueCampaignsRef.push();
// newCampaign.set({
//   campaignId:"-KSWfR6vOhizHMX4YUZ7",
//   campaignFullTitle:"Public Facilities Privacy & Security Act",
//   campaignGeoTitle:"North Carolina",
//   campaignShortTitle:"HB2"
// });


// var legislatorOfficesRef = db.ref("campaign/" + "-KSWfR6vOhizHMX4YUZ7/" + "legislatorOffices");
// var newLegislatorOffices = legislatorOfficesRef.push()
// newLegislatorOffices.set("ocd-division/country:us/state:ca/cd:12");


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

// var candidatesForEqualityJSON = [
//   {
//     "name": "Kamala Harris",
//     "officeName": "United States Senate",
//     "divisionId": "ocd-division/country:us/state:ca",
//     "photoURL": "https://pbs.twimg.com/profile_images/748529895525883904/fZb_aErg.jpg",
//     "isLGBT": "FALSE",
//     "source": "Equality California",
//     "endorsementURL": "http://www.eqca.org/our-endorsements/"
//   },
//   {
//     "name": "Jared Huffman",
//     "officeName": "United States House of Representatives CA-2",
//     "divisionId": "ocd-division/country:us/state:ca/cd:2",
//     "photoURL": "https://pbs.twimg.com/profile_images/651435990100279296/5lQBk2Ut.png",
//     "isLGBT": "FALSE",
//     "source": "Equality California",
//     "endorsementURL": "http://www.eqca.org/our-endorsements/"
//   }
// ]

// Code to add more candidate
// var candidateRef = db.ref("candidate");
// for (var candidate in candidatesForEqualityJSON){
//   var newCandidate = candidateRef.push();
//   newCandidate.set(candidatesForEqualityJSON[candidate]);
// }

// var organizationsJSON = [
//   {
//     "name": "Human Rights Campaign",
//     "divisionId": "ocd-division/country:us",
//     "homeURL": "http://www.hrc.org",
//     "donationURL": "https://netdonor.net/ea-action/action?ea.client.id=1954&ea.campaign.id=44299&ea.tracking.id=or_gnr_hrc_support_donate&_ga=1.240161859.1935039609.1460182471",
//     "about": "The Human Rights Campaign represents a force of more than 1.5 million members and supporters nationwide. As the largest national lesbian, gay, bisexual, transgender and queer civil rights organization, HRC envisions a world where LGBTQ people are ensured of their basic equal rights, and can be open, honest and safe at home, at work and in the community.",
//     "logoImageURL": "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/organizations%2FhumanRightsCampaign%2FhumanRightsCampaign.png?alt=media&token=1e655f74-7fa7-44d1-bdac-7fb973fabad0"
//   },
//   {
//     "name": "Equality California",
//     "divisionId": "ocd-division/country:us/state:ca",
//     "homeURL": "http://www.eqca.org",
//     "donationURL": "https://secure.eqca.org/page/contribute/donate",
//     "about": "Equality California is the nation’s largest statewide lesbian, gay, bisexual and transgender civil rights organization dedicated to creating a fair and just society. Our mission is to achieve and maintain full and lasting equality, acceptance, and social justice for all people in our diverse LGBT communities, inside and outside of California. Our mission includes advancing the health and well-being of LGBT Californians through direct healthcare service advocacy and education. Through electoral, advocacy, education and mobilization programs, we strive to create a broad and diverse alliance of LGBT people, educators, government officials, communities of color and faith, labor, business, and social justice communities to achieve our goals.",
//     "logoImageURL": "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/organizations%2FequalityCalifornia%2FequalityCalifornia.png?alt=media&token=c62f3559-e06f-4e66-8858-95d5f597d184"
//   }
// ]

// var orgRef = db.ref("organization");
// for (var organization in organizationsJSON){
//   var newOrg = orgRef.push();
//   newOrg.set(organizationsJSON[organization]);
// }


// var issuesJSON = [
//   {
//     "name": "Adoption and Parental Rights",
//     "divisionId": "ocd-division/country:us",
//     "writeup": "There are an estimated six million Americans (children and adults) with an LGBT parent. States with the highest proportions of same-sex couples raising biological, adopted, or step-children include Mississippi (26%), Wyoming (25%), Alaska (23%), Idaho (22%), and Montana (22%). Same-sex couples and their children are more likely to be racial and ethnic minorities. An estimated 39% of individuals in same-sex couples with children under age 18 at home are non-white, as are half of their children. Across most of the U.S., LGBT people and couples can petition family courts to provide their children with legal ties to their parents. Family courts are responsible for making case-by-case decisions based on the best interests of a child, and their expertise and authority in determining the fitness of adoptive parents – gay or straight – is traditionally acknowledged and respected. Most states do not have blanket policies on adoption by same-sex couples. In a few states, however, anti-LGBT activists have sought to circumvent family courts by proposing sweeping laws that would ban adoption by LGBT people and/or same-sex couples. Single-parent adoption by lesbian, gay, and bisexual parents is permitted in most states and the District of Columbia. Joint adoption and/or second-parent adoption – where a parent co-adopts his or her partner's child, thus providing the security that comes with having two legally connected parents – is permitted by statute or appellate court decisions in several states.",
//     "writeupAuthor": "GLAAD",
//     "writeupAuthorURL": "http://www.glaad.org/about",
//     "writeupFullURL": "http://www.glaad.org/vote/topics/adoption-parental-rights"
//   },
//   {
//     "name": "Bullying",
//     "divisionId": "ocd-division/country:us",
//     "writeup": "In September of 2010, the suicide deaths of several gay teenagers garnered widespread attention and sparked a national conversation about bullying and harassment that youth, especially LGBT youth, face. Rejection, discrimination, and harassment are all things LGBT youth may experience just for being who they are. It is of utmost importance that LGBT youth see visible signs of solidarity, both within and outside of the LGBT community. As young people are forced to confront anti-LGBT animus, be it online, in their classrooms, or even at home, LGBT youth consequentially may feel they lack a safe, accepting, and affirming space in which they can thrive. Working to end building will help all youth succeed, be it academically, socially, or emotionally, to their fullest capacity. According to the Gay, Lesbian & Straight Education Network (GLSEN)'s 2013 National School Climate Survey, 74.1% of LGBT students were verbally harassed because of their sexual orientation and 61.6% of students said that their reports to school staff did not result in any change or action. These are just two sobering statistics out of many that GLSEN provides regarding the plight of LGBT students in schools today. That is why GLAAD started its annual anti-bullying campaign, Spirit Day. Spirit Day began as a way to show support for LGBT youth and take a stand against bullying. Following a string of high-profile suicide deaths of gay teens in 2010, GLAAD worked to involve millions of teachers, workplaces, celebrities, media outlets and students in going purple on social media or wearing purple, a color that symbolizes spirit on the rainbow flag. Spirit Day now occurs every year on the third Thursday in October, during National Bullying Prevention Month, and has become the most visible day of support for LGBT youth. The campaign unites communities, corporations, celebrities, landmarks, faith groups, sports leagues, schools and so much more, to send a much needed message of solidarity and acceptance to LGBT youth.",
//     "writeupAuthor": "GLAAD",
//     "writeupAuthorURL": "http://www.glaad.org/about",
//     "writeupFullURL": "http://www.glaad.org/vote/topics/bullying"
//   }];

// Code to add more issue
// var issueRef = db.ref("issue");
// for (var issue in issuesJSON){
//   var newIssue = issueRef.push();
//   newIssue.set(issuesJSON[issue]);
// }

// var candidateRef = db.ref("candidate");
// var newCandidate = candidateRef.push();
// newCandidate.set({
//   "divisionId":"ocd-division/country:us",
//   "officeName":"President of the United States",
//   "isLGBT":false,
//   "name":"Hillary Clinton",
//   "source":"eqca",
//   "photoURL":"https://pbs.twimg.com/profile_images/750300510264107008/G8-PA5KA.jpg"
// });



// Code to add issues
// var issueRef = db.ref("issue");
// var issues = ["Adoption and Parental Rights", "Bullying", "The Equality Act", "Global LGBT Rights", "HIV & AIDS", "Immigration", "Marriage Equality", "Nondiscrimination Protection","Religion & Faith","Religious Freedom Restoration", "Transgender People", "Voter ID Laws"];
// for (var issue in issues){
//   var newIssue = issueRef.push();
//   newIssue.set({
//     "divisionId":"ocd-division/country:us",
//     "title":issues[issue]
//   });
// }




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

function addDupStoriesToCampaignWithId(id){

// add story to campaign
var campaignStoriesRef = db.ref("story/" + id);
  for (var i = 0; i < 100; i ++){
      var newStory = campaignStoriesRef.push();
      newStory.set({
        authorCity: "Los Angeles",
        authorDisplayName: "" + i + "queenofthehill",
        authorId: "Zl59GEywfGbCChVCRxHxc005yHA2",
        authorPhotoURL:"https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2FZl59GEywfGbCChVCRxHxc005yHA2%2FprofileImages%2FprofileImage.jpg?alt=media&token=ad8eb328-9ef2-48ec-862a-9048bd3922ba",
        authorState: "CA",
        date: (new Date).getTime()/1000,
        likeCount: 0,
        storyAudioURL: "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/stories%2F-KSXYqQmIrXJBqULSXtO%2F-KSXYqQmIrXJBqULSXtO.m4a?alt=media&token=d45da474-986b-439e-864a-89dc213a371a",
        storyImageURL: "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/stories%2F-KSXYqQmIrXJBqULSXtO%2F-KSXYqQmIrXJBqULSXtO.jpg?alt=media&token=7c878948-8853-457e-ae8a-6c25a605c7cf",
        textNarrative: "It's now the law for me to share a restroom with your wife."
      });

  }
}

function setStoryWithDemoContent(){
var storyRef = db.ref("story/")
storyRef.set({
    "-KSWfR6vOhizHMX4YUZ7" : {
      "-KSXOBT0MBJQ1Lx67NTy" : {
        "authorCity" : "Los Angeles",
        "authorDisplayName" : "Susan L.",
        "authorId" : "M9U5fILXhafw6quRTeVI5fU9ufc2",
        "authorPhotoURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2FM9U5fILXhafw6quRTeVI5fU9ufc2%2FprofileImages%2FprofileImage.jpg?alt=media&token=d361b288-23c2-46c5-87d8-6ef260e380d8",
        "authorState" : "CA",
        "date" : 1.474824554305876E9,
        "likeCount" : 4,
        "likedBy" : {
          "RoN2n7TW7hel7effJ457bUm6mEy1" : true
        },
        "textNarrative" : "I stay out of your bathroom, you stay out of mine."
      },
      "-KSXSzCY2dsFqzMzr6n8" : {
        "authorCity" : "Los Angeles",
        "authorDisplayName" : "Jerrod D.",
        "authorId" : "aYj2W0epVzTx2lRGeI1ruNVGVtR2",
        "authorPhotoURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2FaYj2W0epVzTx2lRGeI1ruNVGVtR2%2FprofileImages%2FprofileImage.jpg?alt=media&token=c7f792bc-3d12-4dfe-a1f6-3ab525111ab4",
        "authorState" : "CA",
        "date" : 1.474825810547879E9,
        "likeCount" : 18,
        "likedBy" : {
          "6OIyVuRaekhgpEnR7zV8rMN0nGu1" : true,
          "PhO3l11k6SXQ7PKf9jOf96aJbXC3" : true,
          "RoN2n7TW7hel7effJ457bUm6mEy1" : true
        },
        "storyAudioURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2FaYj2W0epVzTx2lRGeI1ruNVGVtR2%2Fpublic%2FstoryAudios%2F-KSXSzCY2dsFqzMzr6n8.m4a?alt=media&token=d3e8d23f-0f03-4dc4-966c-23809f8d0ec4",
        "textNarrative" : "I'm a cis guy, but I used a nongendered bathroom the other day, and you know what? I had no idea what the guy/girl/person was doing the stall next to me -- and I didn't care."
      },
      "-KSXYqQmIrXJBqULSXtO" : {
        "authorCity" : "Los Angeles",
        "authorDisplayName" : "queenofthehill",
        "authorId" : "Zl59GEywfGbCChVCRxHxc005yHA2",
        "authorPhotoURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2FZl59GEywfGbCChVCRxHxc005yHA2%2FprofileImages%2FprofileImage.jpg?alt=media&token=ad8eb328-9ef2-48ec-862a-9048bd3922ba",
        "authorState" : "CA",
        "date" : 1.474827347649917E9,
        "likeCount" : 5,
        "likedBy" : {
          "6OIyVuRaekhgpEnR7zV8rMN0nGu1" : true,
          "PhO3l11k6SXQ7PKf9jOf96aJbXC3" : true,
          "RoN2n7TW7hel7effJ457bUm6mEy1" : true
        },
        "storyAudioURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/stories%2F-KSXYqQmIrXJBqULSXtO%2F-KSXYqQmIrXJBqULSXtO.m4a?alt=media&token=d45da474-986b-439e-864a-89dc213a371a",
        "storyImageURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/stories%2F-KSXYqQmIrXJBqULSXtO%2F-KSXYqQmIrXJBqULSXtO.jpg?alt=media&token=7c878948-8853-457e-ae8a-6c25a605c7cf",
        "textNarrative" : "It's now the law for me to share a restroom with your wife."
      },
      "-KTeI2Emr6nu_Bj40hkq" : {
        "authorCity" : "San Francisco",
        "authorDisplayName" : "test1009",
        "authorId" : "F1IBhu9Q5tacrNmolggQk9OjsUQ2",
        "authorPhotoURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/system%2FUI%2FpersonImagePlaceholder.pdf?alt=media&token=62b27f6d-0819-416c-8d13-6dc0635647e0",
        "authorState" : "CA",
        "date" : 1.476030937083639E9,
        "likeCount" : 5,
        "likedBy" : {
          "6OIyVuRaekhgpEnR7zV8rMN0nGu1" : true,
          "PhO3l11k6SXQ7PKf9jOf96aJbXC3" : true,
          "RoN2n7TW7hel7effJ457bUm6mEy1" : true
        },
        "storyAudioURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2FF1IBhu9Q5tacrNmolggQk9OjsUQ2%2Fpublic%2FstoryAudios%2F-KTeI2Emr6nu_Bj40hkq.m4a?alt=media&token=060dfe09-a2d4-41cb-8d8e-d154facd23a3",
        "textNarrative" : "test"
      }
    },
    "-KSWgJKMUZFzsSIdCPmv" : {
      "-KSXi6YyZHUkN1RvSjAj" : {
        "authorCity" : "Los Angeles",
        "authorDisplayName" : "Eduardo C.",
        "authorId" : "GLt4emgLtDVCJvlmXp33cUwN1Tw1",
        "authorPhotoURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2FGLt4emgLtDVCJvlmXp33cUwN1Tw1%2FprofileImages%2FprofileImage.jpg?alt=media&token=9d0080b0-fbaa-474f-9bc6-d094038cc63d",
        "authorState" : "CA",
        "date" : 1.474830039098519E9,
        "likeCount" : 0,
        "textNarrative" : "El amor es inherente en el ser humano. Matrimonio gay ahora."
      },
      "-KSXiScvbRh5VQkzmkW1" : {
        "authorCity" : "Los Angeles",
        "authorDisplayName" : "Tamara Smith",
        "authorId" : "BJYKkRE7bSVvTbunUf6SZPJEWUC2",
        "authorPhotoURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2FBJYKkRE7bSVvTbunUf6SZPJEWUC2%2FprofileImages%2FprofileImage.jpg?alt=media&token=2a5555c1-05e3-4746-b76d-5f8d49aac990",
        "authorState" : "CA",
        "date" : 1.474830129653872E9,
        "likeCount" : 0,
        "textNarrative" : "Mis papás apoyan a mi y mi novia! Amor es amor!"
      },
      "-KSXiqPvnCN1cNmZfph1" : {
        "authorCity" : "Los Angeles",
        "authorDisplayName" : "elgustodelacasa",
        "authorId" : "F9RfvQwxOJOdNJOFw9vQ1bCXPR03",
        "authorPhotoURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2FF9RfvQwxOJOdNJOFw9vQ1bCXPR03%2FprofileImages%2FprofileImage.jpg?alt=media&token=16e245f5-3369-4fcc-aa12-900777fa4fb8",
        "authorState" : "CA",
        "date" : 1.474830231160845E9,
        "likeCount" : 1,
        "likedBy" : {
          "uid" : true
        },
        "storyImageURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/stories%2F-KSWgJKMUZFzsSIdCPmv%2F-KSXiqPvnCN1cNmZfph1.jpg?alt=media&token=37a9db0d-dee3-47b0-86ee-ece4dae5c1fc",
        "textNarrative" : "Mi pareja, mis hijos y yo apoyos el matrimonio gay!"
      }
    },
    "-KSWjWOIzeCBEdbylulu" : {
      "-KSXjMzEnDz9_uD4uGMF" : {
        "authorCity" : "Los Angeles",
        "authorDisplayName" : "田恩熊",
        "authorId" : "cTAHmko8kAaVaESQ4kvwM0wImHG3",
        "authorPhotoURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2FcTAHmko8kAaVaESQ4kvwM0wImHG3%2FprofileImages%2FprofileImage.jpg?alt=media&token=5fdcef5a-c4fd-40a4-982b-3d6206eb6020",
        "authorState" : "CA",
        "date" : 1.474830368651383E9,
        "likeCount" : 0,
        "textNarrative" : "我要跟我男友結婚！都民國幾年了，歧視早退流行了！\uD83D\uDE24"
      },
      "-KSXk3nH50SRA7K0rUr4" : {
        "authorCity" : "Los Angeles",
        "authorDisplayName" : "天上的星星",
        "authorId" : "jYb3YnB0HmbArBxETnQGZQYUN803",
        "authorPhotoURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2FjYb3YnB0HmbArBxETnQGZQYUN803%2FprofileImages%2FprofileImage.jpg?alt=media&token=0c1deee8-cb8c-476d-9fcb-9b949fc02f74",
        "authorState" : "CA",
        "date" : 1.474830552212962E9,
        "likeCount" : 0,
        "storyImageURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/stories%2F-KSWjWOIzeCBEdbylulu%2Ftaiwan_les.jpg?alt=media&token=fb51a905-e595-47d6-9ba9-50ae1d81b805",
        "textNarrative" : "我跟女友在一起很久了，家人也都支持，就讓我們幸福在一起好嗎？\uD83D\uDC4C"
      },
      "-KSXkZ73-cwnV9VrfkML" : {
        "authorCity" : "Los Angeles",
        "authorDisplayName" : "嫦娥",
        "authorId" : "WR73fgBNcaUxPGRizb2icKCL3Z22",
        "authorPhotoURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2FWR73fgBNcaUxPGRizb2icKCL3Z22%2FprofileImages%2FprofileImage.jpg?alt=media&token=d0187a2b-7bb3-484c-8f66-4c9ff243acb5",
        "authorState" : "CA",
        "date" : 1.474830680537074E9,
        "likeCount" : 0,
        "textNarrative" : "該是讓婚姻平權實踐的時候了，台灣有機會成為東亞人權模範，我們再加把勁！"
      }
    },
    "-KSWkjYPh_s-H-TEVLvs" : {
      "-KSXmHyT7qO2u0FYT8-z" : {
        "authorCity" : "Los Angeles",
        "authorDisplayName" : "‎عالي",
        "authorId" : "TMb42Gz7OvNhgMS2YqD9B35zaxj2",
        "authorPhotoURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2FTMb42Gz7OvNhgMS2YqD9B35zaxj2%2FprofileImages%2FprofileImage.jpg?alt=media&token=e31136bd-02f8-4dbf-8c27-371108cd9b0b",
        "authorState" : "CA",
        "date" : 1.474831134197627E9,
        "likeCount" : 0,
        "textNarrative" : "‎يرجى إلغاء القانون اللواط. دبي ليست بالضبط على مع الزمن إذا كان لا يزال قائما."
      },
      "-KSXmt2cER_Jmz-bAtIr" : {
        "authorCity" : "Los Angeles",
        "authorDisplayName" : "عبد العزيز",
        "authorId" : "u8NZR1bM5cePrt8cC0qv0NJmOT43",
        "authorPhotoURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2Fu8NZR1bM5cePrt8cC0qv0NJmOT43%2FprofileImages%2FprofileImage.jpg?alt=media&token=44a43a84-5c71-4013-bfac-95eb00481518",
        "authorState" : "CA",
        "date" : 1.4748312905577E9,
        "likeCount" : 0,
        "textNarrative" : "لا يمكنني السفر إلى دبي أو الإمارات إذا استمر القانون اللواط في تهديد رفاهية وهدد به."
      },
      "-KSXnO9i5YJOcv1GLcoT" : {
        "authorCity" : "Los Angeles",
        "authorDisplayName" : "‎عائشة",
        "authorId" : "6WOI1WBKJ8XCay1fTZAC8z7uLu82",
        "authorPhotoURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/users%2F6WOI1WBKJ8XCay1fTZAC8z7uLu82%2FprofileImages%2FprofileImage.jpg?alt=media&token=b6aa4fca-4f60-4246-af49-5aeec00525d7",
        "authorState" : "CA",
        "date" : 1.47483142208223E9,
        "likeCount" : 0,
        "storyImageURL" : "https://firebasestorage.googleapis.com/v0/b/speakout-9d07b.appspot.com/o/stories%2F-KSWkjYPh_s-H-TEVLvs%2F-KSXnO9i5YJOcv1GLcoT.jpg?alt=media&token=3f254048-b12c-4b28-ad36-8e1593129889",
        "textNarrative" : "‎أود أن أرى أن يترك القانون اللواط في الماضي. انها ضد الطبيعة البشرية.."
      }
    }
  });

}
import express from 'express';
var http 					= require('http');
var https 					= require('https');
var bodyParser 				= require('body-parser');
var cookieParser 			= require('cookie-parser');
var session      			= require('express-session');
var mongoose 				= require('mongoose');
var MongoStore 				= require('connect-mongo')(session);
var moment 					= require('moment');
const app 					= express();
var path 					= require('path');
var formidable 				= require('formidable');
var fs 						= require('fs');
const aws 					= require('aws-sdk');
const querystring 			= require('querystring');
const Clarifai 				= require('clarifai');
const vision 				= require('@google-cloud/vision');
import {
//Utilities
  pad,
  def,
  fallback,
  nullFallback,
  err,
  errstr,
  errdict,
  geterr,
  errored,
  projf,
  projff,
//Concurrency Utilities
  Maybe,
//Object utilities
  mutate,
  remove,
  rotate,
  loop
} from 'wircho-utilities';
import {
  QueryItem,
  URLComponents,
  RequestBackEndHelpers,
  RequestHelpers,
  Request,
  request,
  Twitter
} from 'wircho-web-utilities';

//Local Terminal Command
//MONGODB_URI=mongodb://localhost:27017 MONGODB_SECRET=*** TWITTER_KEY=*** TWITTER_SECRET=*** TWITTER_CALLBACK=http://wircho.com CLARIFAI_KEY=??? GOOGLE_VISION_FILE_PATH=../mv-2f70dc320c4b.json npm start

//Clear Cache Command
//

//Settings
RequestHelpers.use(RequestBackEndHelpers);

//Database+Session
const MONGODB_URI = fallback(process.env.MONGODB_URI);
const MONGODB_SECRET = fallback(process.env.MONGODB_SECRET);
mongoose.connect(MONGODB_URI, function(error) {
	if (error) {
		console.log("Error connecting to Mongo:");
		console.log(error);
	}
});

const db = mongoose.connection;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    cookie: { maxAge: 1000*60*60*24*365 } ,
    secret: MONGODB_SECRET ,
    resave: true,
    saveUninitialized: true,
    store:new MongoStore({
    	mongooseConnection: db,
        collection: 'session', 
        auto_reconnect:true
    })
}));

//Babel+Webpack
app.use('/', express.static('public'));

//Request Test (Reddit)
app.get('/reddit/hot', function(req,res) {
	request("GET","https://www.reddit.com/hot.json","json").onLoad(function(data) {
		res.json(data);
	}).onError(function(error) {
		res.json(errdict(error));
	}).send();
});

//Twitter - Auth Status
//Possible returns:
//{logged_in:false, request_token:...}
//{logged_in:true}
//{error:"Something went wrong", code:1}
//{error:...}
app.get('/twitter/auth_status', function(req,res) {
	getAuthStatus(req,res);
});
function getAuthStatus(req,res) {
	var logged_in = def(req.session.twitter) ? req.session.twitter.logged_in : false;
	if (logged_in) {
		var access_token = req.session.twitter.access_token;
		var token_secret = req.session.twitter.token_secret;
		errored((res,rej) => Twitter.verifyAccessToken(access_token,token_secret,res,rej)).then(function(info) {
			var json = info.content;
			var screen_name = json.screen_name;
			if (!def(screen_name)) {
				if (info.response.statusCode === 401) { // Unauthorized
					req.session.twitter = {logged_in: false};
					getAuthStatus(req,res);
				} else {
					res.json({error:"Something went wrong. No screen name.", code:1});
				}
				return;
			}
			req.session.twitter = {
				logged_in:true,
				access_token,
				token_secret,
				screen_name
			}
			res.json({logged_in, screen_name});
		}, function(error) {
			var edict = errdict(error);
			edict.code = 1;
			res.json(edict);
		});
	} else {
		var request_token = undefined;
		var token_secret = undefined;
		if (def(req.session.twitter)) {
			var currentTimestamp = Math.floor(Date.now() / 1000);
			var request_token_timestamp = req.session.twitter.request_token_timestamp;
			if (def(request_token_timestamp) && request_token_timestamp > currentTimestamp - 3) {
				request_token = req.session.twitter.request_token;
				token_secret = req.session.twitter.token_secret;
			}
		}
		if (def(request_token) && def(token_secret)) {
			res.json({logged_in, request_token});
		} else {
			var callbackURL = req.query.callback;
			errored((res,rej) => Twitter.getRequestToken(callbackURL,res,rej)).then(function(info) {
				var data = info.content;
				var json = QueryItem.dictionaryFromString(data);
				if (!def(json.oauth_token)) {
					res.json({error:"Something went wrong. No request token.", data, code:1});
					return;
				}
				req.session.twitter = {
					logged_in:false,
					request_token:json.oauth_token,
					token_secret:json.oauth_token_secret,
					request_token_timestamp: Math.floor(Date.now() / 1000)
				}
				console.log("Twitter request info:");
				console.log(req.session.twitter);
				res.json({logged_in:false,request_token:json.oauth_token});
			}, function(error) {
				var edict = errdict(error);
				edict.code = 1;
				res.json(edict);
			});
		}
	}
}

//Twitter - Get Access
//Parameters: request_token, verifier
//Possible returns:
//{}
//error
app.get('/twitter/get_access', function(req,res) {
	var request_token = req.query.request_token;
	var verifier = req.query.verifier;
	if (!def(req.session.twitter) || !def(req.session.twitter.request_token) || request_token !== req.session.twitter.request_token) {
		req.session.twitter = {logged_in: false};
		res.json({error:"Request token does not match. User has been logged out", code:2});
		return;
	}
	var token_secret = req.session.twitter.token_secret;
	errored((res,rej) => Twitter.getAccessToken(verifier,request_token,token_secret,res,rej)).then(function(info) {
		var data = info.content;
		var json = QueryItem.dictionaryFromString(data);
		if (!def(json.oauth_token)) {
			if (info.response.statusCode === 401) { // Unauthorized
				req.session.twitter = {logged_in: false};
				res.json({error:"Bad token/authorization. User has been logged out.", data, code:2});
			} else {
				res.json({error:"Something went wrong", data, code:1});
			}
			return;
		}
		req.session.twitter = {
			logged_in:true,
			access_token:json.oauth_token,
			token_secret:json.oauth_token_secret
		}
		console.log("Twitter access info:");
		console.log(req.session.twitter);
		res.json({});
	}, function(error) {
		var edict = errdict(error);
		edict.code = 1;
		res.json(edict);
	});
});

//Twitter - Log Out
app.get('/twitter/log_out', function(req,res) {
	req.session.twitter = {logged_in: false};
	res.json({});
});

//Twitter - Endpoint
app.get('/twitter/endpoint/:endpoint', function(req,res) {
	getEndpoint(req.params.endpoint,req.query,req,res);
});
app.get('/twitter/endpoint/:first/:second', function(req,res) {
	getEndpoint(req.params.first + "/" + req.params.second,req.query,req,res);
});
function getEndpoint(endpoint,query,req,res) {
	var logged_in = def(req.session.twitter) ? req.session.twitter.logged_in : false;
	if (!logged_in) {
		res.json({error:"User is not logged in.", code:2});
		return;
	}
	var access_token = req.session.twitter.access_token;
	var token_secret = req.session.twitter.token_secret;
	errored((res,rej) => Twitter.getEndpoint(endpoint,query,access_token,token_secret,res,rej)).then(function(info) {
		var json = info.content;
		if (info.response.statusCode === 401) {
			req.session.twitter = {logged_in: false};
			res.json({error:"Bad token/authorization. User has been logged out.", data: info.content, code:2});
			return;
		}
		res.json(json);
	}, function(error) {
		var edict = errdict(error);
		edict.code = 1;
		res.json(edict);
	});
}

//Twitter - User Stream
app.get('/twitter/stream/user', function(req,res) {
	var logged_in = def(req.session.twitter) ? req.session.twitter.logged_in : false;
	if (!logged_in) {
		res.json({error:"User is not logged in.", code:2});
		return;
	}
	var access_token = req.session.twitter.access_token;
	var token_secret = req.session.twitter.token_secret;
	var firstData = true;
	var foundError = false;

	var twitterRequest = undefined;
	var closedConnection = false;
	req.on("close", function(err) {
		console.log("CONNECTION WAS CLOSED!");
		closedConnection = true;
		if (def(twitterRequest)) {
			console.log("REQUEST WAS ABORTED!");
			twitterRequest.abort();
		}
	});
	Twitter.streamUserFeed(req.query,access_token,token_secret,function(info) {
		console.log("STREAM DATA: " + JSON.stringify({data:info.data + ""}));
		if (firstData) {
			twitterRequest = info.request;
			if (closedConnection || (info.data + "").substring(0,1) !== "{") {
				console.log("CONNECTION WAS CLOSED & REQUEST WAS ABORTED BEFORE FIRST RESPONSE!");
				foundError = true;
				info.request.abort();
				res.end();
				return;
			}
		}
		firstData = false;
		if (!foundError && !closedConnection) {
			res.write(info.data);
		}
	},function(error) {
		console.log("STREAM ERROR!");
		res.write("<<<ERROR>>>\n");
		res.end();
	});
});

//Twitter - oEmbed
app.get('/twitter/oembed', function(req,res) {
	var url = req.query.url;
	errored((res,rej) => Twitter.oEmbed(url,res,rej)).then(function(info) {
		res.json(info.content);
	}, function(error) {
		var edict = errdict(error);
		edict.code = 1;
		res.json(edict);
	});
})

// Stream test
app.get('/stream_test', function(req,res) {
	var counter = 0;
	function doNext() {
		counter += 1;
		res.write(":" + counter + "\n");
		setTimeout(function() {
			doNext();
		},3000);
	}
	doNext();
})

// Clarifai tags
const cai = new Clarifai.App({
	apiKey: process.env.CLARIFAI_KEY
});
app.get('/clarifai/tags', function(req,res) {
	const url = req.query['url'];

	cai.models.predict(Clarifai.GENERAL_MODEL, url).then(
		function(response) {
			res.json(response);
		},
		function(err) {
			res.json(errdict(error));
		}
	);
});

// Google Vision tags
if (!fs.existsSync(process.env.GOOGLE_VISION_FILE_PATH)) {
	var text = JSON.parse(process.env.GOOGLE_VISION_FILE_INFO).text;
	// var keys = process.env.GOOGLE_VISION_KEYS.split(",");
	// var values = keys.map((key) => process.env[process.env.GOOGLE_VISION_PREFIX + key].replace("\\n","\n"));
	// var dict = {};
	// for (var i=0; i<keys.length; i+=1) {
	// 	dict[keys[i]] = values[i];
	// }
	fs.writeFileSync(process.env.GOOGLE_VISION_FILE_PATH, text);
}

const gv = vision({
  projectId: 'mokriya-vision',
  keyFilename: process.env.GOOGLE_VISION_FILE_PATH
});
app.get('/google-vision/tags', function(req,res) {
	gv.detectText('./text.jpg', function(err, text) {
  		res.json({err:""+err, text});
	});
});


//Server
app.listen(process.env.PORT || 8080);
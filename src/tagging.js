import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Immutable from 'immutable';
var classNames = require('classnames');
import $ from 'jquery';
import 'jquery-form';
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
  projf,
  projff,
//Object utilities
  mutate,
  remove,
  rotate,
  defaults
} from 'wircho-utilities';
import {
  QueryItem,
  URLComponents,
  RequestFrontEndHelpers,
  RequestHelpers,
  Request,
  request
  //,
  // /* No need for Twitter */ Twitter
} from 'wircho-web-utilities';

// For Node Utitlities
function isstring(x) {
  return typeof x === 'string' || x instanceof String;
}

//Settings
RequestHelpers.use(RequestFrontEndHelpers);

const ACTIONS = {
  /*ADD_TWEET:"ADD_TWEET", // tweet
  UPDATE_TWEET_HTML:"UPDATE_TWEET_HTML", // id_str, html
  UPDATE_VALUE:"UPDATE_VALUE", // propKey, value
  LOGGED_IN:"LOGGED_IN", // no params
  GOT_REQUEST_TOKEN:"GOT_REQUEST_TOKEN"*/
  UPDATE_CLARIFAI_RESPONSE: "UPDATE_CLARIFAI_RESPONSE", // response (could be undefined)
  UPDATE_GOOGLE_RESPONSE: "UPDATE_GOOGLE_RESPONSE", // response (could be undefined)
  UPDATE_IMAGE: "UPDATE_IMAGE" // url (could be undefined)
}

//Globals
var base_url = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
console.log("base: " + base_url);


// Redux model:
/*
{
  clarifai_response:...
  google_response:...
  image:...
}
*/

// Redux model
/* For Twitter app
{
  tweets:[id_str, id_str, ...],
  tweet_jsons:{id_str:{...}, ...},
  tweet_embed_htmls:{id_str:{...}, ...}
  keywordList:"...",
  importantUserList:"...",
  defaultsKeywordList:"...",
  defaultsImportantUserList:"...",
  logged_in:true,
  request_token:...,
  verifier:...,
  error:...,
  show_stream_error:...
}
*/

// Actions creators
//const startLoading = ()=>({type:ACTIONS.START_LOADING});

// Reducer
/*
// FOR TWITTER APP
var _kl = defaults.get("keywordList");
var _iul = defaults.get("importantUserList");
var _href = window.location.href;
console.log("href: " + _href);
var _comps = new URLComponents(_href);
console.log("Components:");
console.log(_comps);
var _params = _comps.params;
console.log("Params:");
console.log(_params);
var _uq = QueryItem.dictionaryFromArray(_params);
console.log("_uq:");
console.log(_uq);
var _rt = _uq.oauth_token;
var _vr = _uq.oauth_verifier;
console.log("oauth_token: " + _rt);
console.log("verifier: " + _vr);
const initialState = {
  keywordList:_kl,
  importantUserList:_iul,
  defaultsKeywordList:_kl,
  defaultsImportantUserList:_iul
};
if (def(_rt) && def(_vr)) {
  initialState.request_token = _rt;
  initialState.verifier = _vr;
  initialState.logged_in = false;
}*/
//const initialState = {clarifai_response: {}, google_response: "loading..."};
const initialState = {};
function app(state,action) {
  if (!def(state)) {
    return initialState
  }
  switch (action.type) {
    case ACTIONS.UPDATE_CLARIFAI_RESPONSE:
      if (def(action.response)) {
        return mutate(state, {clarifai_response: action.response});
      } else {
        return remove(state, "clarifai_response");
      }
    case ACTIONS.UPDATE_GOOGLE_RESPONSE:
      if (def(action.response)) {
        return mutate(state, {google_response: action.response});
      } else {
        return remove(state, "google_response");
      }
    case ACTIONS.UPDATE_IMAGE:
      if (def(action.url)) {
        return mutate(state, {image: action.url});
      } else {
        return remove(state, "image");
      }
    /* // FOR TWITTER APP:
    case ACTIONS.ADD_TWEET:
      var json = {};
      json[action.tweet.id_str] = action.tweet;
      return mutate(
        state,
        {
          tweets:fallback(state.tweets, new Array()).concat([action.tweet.id_str]),
          tweet_jsons:mutate(fallback(state.tweet_jsons,{}),json)
        }
      );
    break;
    case ACTIONS.UPDATE_TWEET_HTML:
      var json = {};
      json[action.id_str] = action.html;
      return mutate(
        state,
        {
          tweet_embed_htmls:mutate(fallback(state.tweet_embed_htmls,{}),json)
        }
      );
    break;
    case ACTIONS.LOGGED_IN:
      return mutate(state, {logged_in:true});
    break;
    case ACTIONS.GOT_REQUEST_TOKEN:
      return mutate(state, {
        logged_in: false,
        request_token: action.request_token
      });
    break;
    case ACTIONS.UPDATE_VALUE:
      var json = {};
      json[action.propKey] = action.value;
      return mutate(
        state,
        json
      );
    break;
    */
    default: return state;
    break;
  }
}

// Map state to props
const mapStateToProps = state=>state;

const mapDispatchToProps = (dispatch) => ({
  // uploadImage: (file) => {
  //   dispatch(startLoading());
  //   uploadFileData(file).then(function(json) {
  //     getImageInfo(json.url).then(function(json) {
  //       dispatch(setInfo(json));
  //     },function(error) {
  //       alert("Something went wrong while processing image: " + errstr(error));
  //       dispatch(setInfo());
  //     });
  //   },function(error) {
  //     alert("Something went wrong while uploading image: " + errstr(error));
  //     dispatch(setInfo());
  //   });
  // }
  
  /*updateValue: (propKey,value) => {
    dispatch({type:ACTIONS.UPDATE_VALUE, propKey, value});
  }*/
  getClarifaiTags: (url) => {
    dispatch({type: ACTIONS.UPDATE_CLARIFAI_RESPONSE, response: "Loading..."});
    var rurl = base_url + "/clarifai/info?url=" + encodeURIComponent(url);
    var r = request("GET",rurl,"json");
    r.onLoad((info) => {
      dispatch({type: ACTIONS.UPDATE_CLARIFAI_RESPONSE, response: info.request.response});
    }).send();
  },
  getGoogleTags: (url) => {
    dispatch({type: ACTIONS.UPDATE_GOOGLE_RESPONSE, response: "Not supported yet (working on it)."});
  },
  updateImage: (url) => {
    dispatch({type: ACTIONS.UPDATE_IMAGE, url})
  }
});

//React classes
const App = React.createClass({
  render: function() {
    /*if (def(this.props.error)) {
      // There's an error to display
      return <ShowError error={this.props.error}/>;
    } else if (!def(this.props.logged_in)) {
      // Needs to check Twitter auth status
      return <NeedsAuthStatus/>;
    } else if (!this.props.logged_in && !def(this.props.verifier)) {
      // Needs to log in. Assume request_token is available
      return <NeedsLogIn request_token={this.props.request_token}/>
    } else if (!this.props.logged_in && def(this.props.verifier)) {
      // Needs to get access token. Assume request token and verifier are available
      return <NeedsAccessToken request_token={this.props.request_token} verifier={this.props.verifier}/>;
    } else {
      // Logged in
      return <ActualApp
        tweets={this.props.tweets}
        tweet_jsons={this.props.tweet_jsons}
        tweet_embed_htmls={this.props.tweet_embed_htmls}
        keywordList={this.props.keywordList}
        importantUserList={this.props.importantUserList}
        defaultsKeywordList={this.props.defaultsKeywordList}
        defaultsImportantUserList={this.props.defaultsImportantUserList}
        updateValue={this.props.updateValue}
        show_stream_error={this.props.show_stream_error}
      />;
    }*/
    return <ActualApp
      clarifai_response={this.props.clarifai_response}
      google_response={this.props.google_response}
      getClarifaiTags={this.props.getClarifaiTags}
      getGoogleTags={this.props.getGoogleTags}
      updateImage={this.props.updateImage}
      image={this.props.image}
    />;
  }
});

/*
const ShowError = React.createClass({
  render: function() {
    return (<div id="show-error">Something went wrong.<br/>Please refresh this page.<br/><br/>{this.props.error}</div>);
  }
});

const NeedsAuthStatus = React.createClass({
  componentDidMount: function() {
    checkTwitterAuthStatus();
  },
  render: function() {
    return (<div id="needs-auth">Checking Twitter Authorization...</div>);
  }
});

var alreadyLoadedAuth = false;
const NeedsLogIn = React.createClass({
  loadAuth: function(event) {
    event.preventDefault();
    if (!alreadyLoadedAuth) {
      loadTwitterAppAuthorization(this.props.request_token);
    }
    alreadyLoadedAuth = true;
  },
  render: function() {
    return <div id ="needs-login">Please authorize Twitter.<br/><br/><a href="" onClick={this.loadAuth} className="login">Authorize</a></div>;
  }
});

const NeedsAccessToken = React.createClass({
  componentDidMount: function() {
    getAccessToken(this.props.request_token,this.props.verifier);
  },
  render: function() {
    return (<div id="needs-access">Please wait...</div>);
  }
});

*/

const ActualApp = React.createClass({
  /*retry: function(event) {
    event.preventDefault();
    this.props.updateValue("show_stream_error",false);
    beginLoading();
  },
  logOut: function(event) {
    event.preventDefault();
    request("GET",base_url + "/twitter/log_out").onLoad(function(info) {
      window.location.reload();
    }).send();
  },
  componentDidMount: function() {
    beginLoading();
  },*/
  render: function() {
    /*var normalTweets = new Array();
    var importantTweets = new Array()
    var tweets = fallback(this.props.tweets,new Array());
    for (var i = tweets.length - 1; i>=0; i-=1) {
      var id_str = tweets[i];
      var tweet = this.props.tweet_jsons[id_str];
      var embed_html = fallback(this.props.tweet_embed_htmls,{})[id_str];
      console.log("tweet id_str: " + id_str);
      console.log("tweet tweet: " + tweet);
      console.log("tweet embed_html: " + embed_html);
      if (matchesUsers(tweet,this.props.defaultsImportantUserList)) {
        importantTweets.push(<Tweet key={id_str} tweet={tweet} embed_html={embed_html} place="important"/>);
      } else if (matchesKeywords(tweet,this.props.defaultsKeywordList)) {
        normalTweets.push(<Tweet key={id_str} tweet={tweet} embed_html={embed_html} place="normal"/>);
      } else {
        //normalTweets.push(<Tweet key={id_str} tweet={tweet} embed_html={embed_html} place="normal" fade="true"/>);
      }
      console.log("Totals:");
    }

    return (
      <div id="inner-content">
        <div id="errory" className={classNames({hidden:this.props.show_stream_error !== true})}>
          Stream error. <a href="" className="retry" onClick={this.retry}>Retry</a> or reload page.
        </div>
        <div id="topy">
          <a href="" className="logout" onClick={this.logOut}>Log Out</a>
        </div>
        <div id="lefty">
          <p>Normal Tweets</p>
          <FilterInput
            buttonTitle="Update Keyword List"
            propKey="keywordList"
            defaultsPropKey="defaultsKeywordList"
            text={this.props.keywordList}
            defaultsText={this.props.defaultsKeywordList}
            updateValue={this.props.updateValue}
          />
          {normalTweets}
        </div>
        <div id="righty">
          <p>Important Tweets</p>
          <FilterInput
            buttonTitle="Update User List"
            propKey="importantUserList"
            defaultsPropKey="defaultsImportantUserList"
            text={this.props.importantUserList}
            defaultsText={this.props.defaultsImportantUserList}
            updateValue={this.props.updateValue}
          />
          {importantTweets}
        </div>
      </div>
    )*/
    return <div>
      <Input updateImage={this.props.updateImage} getClarifaiTags={this.props.getClarifaiTags} getGoogleTags={this.props.getGoogleTags}/>
      <DowloadedImage image={this.props.image}/>
      <ClarifaiKeys response={this.props.clarifai_response}/>
      <GoogleKeys response={this.props.google_response}/>
    </div>
  }
});

const Input = React.createClass({
  getTags: function(event) {
    event.preventDefault();
    var url = $("#url").val();
    this.props.updateImage(url)
    this.props.getClarifaiTags(url);
    this.props.getGoogleTags(url);
  },
  render: function() {
    return <div>
      Enter Image URL:
      <input type="text" id="url"/>
      <input type="button" onClick={this.getTags} value="Get Tags"/>
    </div>;
  }
});

const DowloadedImage = React.createClass({
  render: function() {
    return <div><img src={this.props.image}/></div>
  }
});

const ClarifaiKeys = React.createClass({
  render: function() {
    if (def(this.props.response)) {
      const title = "Clarifai Keys:";
      var response = this.props.response;
      if (isstring(response)) {
        return (<div><h3>{title} {response}</h3></div>);
      } else {
        console.log(title);
        console.log(response);
        var tag = (def(response.results) && response.results.length > 0 && def(response.results[0].result)) ? response.results[0].result.tag : undefined;
        console.log("tag:");
        console.log(tag);
        if (def(tag) && def(tag.classes) && def(tag.probs) && tag.classes.length > 0 && tag.classes.length == tag.probs.length) {
          var tagElements = [];
          for (var i=0; i<tag.classes.length; i+=1) {
            var cls = tag.classes[i];
            var prb = tag.probs[i];
            tagElements.push(<div key={i}>{cls}: {prb}</div>);
          }
          return (<div>
            <h3>{title}</h3>
            <div>{tagElements}</div>
          </div>);
        } else {
          return (<div>
            <h3>{title}</h3>
            <div>Error: No tags.</div>
          </div>);
        }
      }
    } else {
      return null;
    }
  }
});

const GoogleKeys = React.createClass({
  render: function() {
    if (def(this.props.response)) {
      const title = "Google Keys:";
      if (isstring(this.props.response)) {
        return (<div><h3>{title} {this.props.response}</h3></div>);
      } else {
        return (<div>
          <h3>{title}</h3>
          <div></div>
        </div>);
      }
    } else {
      return null;
    }
  }
});

/*

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/hashtag/Overusing?src=hash">#Overusing</a> <a href="https://twitter.com/hashtag/hashtags?src=hash">#hashtags</a> can be <a href="https://twitter.com/hashtag/super?src=hash">#super</a> <a href="https://twitter.com/hashtag/annoying?src=hash">#annoying</a> 😩 Sticking to one or two per Tweet is a good call 😀</p>&mdash; Twitter Support (@Support) <a href="https://twitter.com/Support/status/613308058094039043">June 23, 2015</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

*/

/*
const FilterInput = React.createClass({
  handleChange: function(e) {
    this.props.updateValue(this.props.propKey,e.target.value);
  },
  handleClickUpdate: function() {
    defaults.set(this.props.propKey,this.props.text);
    this.textarea.focus();
    this.props.updateValue(this.props.defaultsPropKey,this.props.text);
  },
  render: function() {
    var text = nullFallback(this.props.text,"");
    var defaultsText = nullFallback(this.props.defaultsText,"");
    return (<p>
      <textarea ref={(area)=>{this.textarea = area;}} className={classNames({modified:text !== defaultsText})} onChange={this.handleChange} value={text}/>
      <br/><br/>
      <input type="button" value={this.props.buttonTitle} onClick={this.handleClickUpdate}/>
    </p>);
  }
});

const Tweet = React.createClass({
  componentDidMount: function() {
    //return;
    //console.log(RequestFrontEndHelpers);
    if (def(this.props.embed_html)) {
      twttr.widgets.load();
    } else {
      var id_str = this.props.tweet.id_str;
      var url = "https://twitter.com/" + this.props.tweet.user.screen_name + "/status/" + id_str;
      request("GET",base_url + "/twitter/oembed","json").setParam("theme","dark").setParam("url",url).setParam("omit_script","1").onLoad(function(info) {
        if (def(info.request.response) && def(info.request.response.html)) {
          store.dispatch({type:ACTIONS.UPDATE_TWEET_HTML, id_str:id_str, html:info.request.response.html});
        }
        console.log("oembed response:");
        console.log(info.request.response);
      }.bind(this)).send();
    }
  },
  componentDidUpdate: function(prevProps) {
    if ((def(this.props.embed_html) && !def(prevProps.embed_html)) || this.props.place !== prevProps.place) {
      twttr.widgets.load();
    }
  },
  render: function() {
    var c = classNames({faded: false || this.props.fade});
    if (def(this.props.embed_html)) {
      var html = this.props.embed_html.replace("<blockquote ","<blockquote data-theme=\"dark\" ");
      var htmlJSON = {__html:html};
      return (<div className={c} dangerouslySetInnerHTML={htmlJSON}/>);
    } else {
      return (<div className={c}><blockquote><p>{this.props.tweet.text}</p>&mdash; {this.props.tweet.user.name} (@{this.props.tweet.user.screen_name})</blockquote></div>)
    }
  }
});

function checkTwitterAuthStatus() {
  request("GET",base_url + "/twitter/auth_status","json").setParam("callback",base_url + "/twitter/").onLoad(function(info) {
    if (def(info.request.response.error)) {
      //console.log("AUTH STATUS OBTAINED: ERROR " + info.request.response.error);
      //setTimeout(function(){
      store.dispatch({type:ACTIONS.UPDATE_VALUE, propKey:"error", value:info.request.response.error});
      //},15000);
    } else if (!def(info.request.response.logged_in)) {
      // console.log("AUTH STATUS OBTAINED: ERROR Bad auth_status answer");
      // setTimeout(function(){
      store.dispatch({type:ACTIONS.UPDATE_VALUE, propKey:"error", value:"Bad auth_status answer"});
      // },15000);
    } else if (info.request.response.logged_in) {
      // console.log("AUTH STATUS OBTAINED: LOGGED IN!");
      // setTimeout(function(){
      store.dispatch({type:ACTIONS.LOGGED_IN});
      // },15000);
    } else if (!def(info.request.response.request_token)) {
      // console.log("AUTH STATUS OBTAINED: ERROR No request token");
      // setTimeout(function(){
      store.dispatch({type:ACTIONS.UPDATE_VALUE, propKey:"error", value:"No request token"});
      // },15000);
    } else {
      // console.log("AUTH STATUS OBTAINED: request_token " + info.request.response.request_token);
      // setTimeout(function(){
      store.dispatch({type:ACTIONS.GOT_REQUEST_TOKEN, request_token:info.request.response.request_token});
      // },15000);
    }
  }).onError(function(info) {
    // console.log("AUTH STATUS OBTAINED: ERROR Error loading auth_status URL.");
    // setTimeout(function(){
    store.dispatch({type:ACTIONS.UPDATE_VALUE, propKey:"error", value:"Error loading auth_status URL."});
    // },15000);
  }).send();
}

function loadTwitterAppAuthorization(request_token) {
  var url = "https://api.twitter.com/oauth/authorize?oauth_token=" + encodeURIComponent(request_token);
  console.log("URL FOR AUTH IS: " + url);
  //setTimeout(function() {
  window.location.replace(url);
  //}, 15000);
}

function getAccessToken(request_token,verifier) {
  request("GET",base_url + "/twitter/get_access","json").setParams({request_token,verifier}).onLoad(function(info) {
    window.location.replace(base_url + "/twitter/");
  }).onError(function(info) {
    window.location.replace(base_url + "/twitter/");
  }).send();
}

function beginLoading() {
  var currentData = "";
  request("GET",base_url + "/twitter/stream/user").onData(function(info) {
    console.log("got info:");
    console.log(info);
    currentData += info.data;
    if (info.data.substring(info.data.length-1) === "\n") {
      var string = currentData;
      currentData = "";
      console.log(string);
      try {
        var json = JSON.parse(string);
        if (def(json.id_str) && def(json.text)) {
          console.log("Yes id_str and text:");
          console.log(json);
          store.dispatch({type:ACTIONS.ADD_TWEET, tweet:json});
        } else {
          console.log("No id_str or text:");
          console.log(json);
        }
      } catch(e) {
        // Ignore chunks that are not proper JSON
        return;
      }
    }
  }).onError(function(info) {
    console.log("Got stream error!");
    store.dispatch({type:ACTIONS.UPDATE_VALUE, propKey:"show_stream_error", value:true});
  }).onEnd(function(info) {
    console.log("Stream ended!");
    store.dispatch({type:ACTIONS.UPDATE_VALUE, propKey:"show_stream_error", value:true});
  }).send();
}

*/

//const onlySymbols = /^[^a-zA-Z0-9_]*$/;
//const allNonAlpha = /[^a-zA-Z0-9_,]/g;
//const allNonAlpha_Space_Star_Exc = /[^a-zA-Z0-9_ \*!]/g;
//const allMultiSpace = /[ ]{2,}/g;
//const initialSpaces = /^[ ]+/;
//const finalSpaces = /[ ]+$/;
//const initialExc = /^!/;
//const initialStar = /^\*/;
//const finalStar = /\*$/;

/*
var keywordREsCache = {};
function matchesKeywords(tweet,_keywordList) {
  var keywordList = nullFallback(_keywordList,"");
  if (keywordList.match(onlySymbols) !== null) {
    return true;
  }
  var keywordREs = keywordREsCache[keywordList];
  if (!def(keywordREs)) {
    keywordREs = getKeywordREs(keywordList);
    keywordREsCache = {};
    keywordREsCache[keywordList] = keywordREs;
  }
  return matchesKeywordREs(tweet,keywordREs);
}

function getKeywordREs(keywordList) {
  return keywordList.split(",").map(function(keyword) {
    var k = keyword
      .replace(allNonAlpha_Space_Star_Exc," ")
      .replace(allMultiSpace," ")
      .replace(initialSpaces,"")
      .replace(finalSpaces,"");
    var fixedCase = false;
    if (k.match(initialExc) !== null) {
      fixedCase = true;
      k = k.replace(initialExc,"").replace(initialSpaces,"");
    } else {
      k = k.toLowerCase();
    }
    var wildcardLeft = false;
    if (k.match(initialStar) !== null) {
      wildcardLeft = true;
      k = k.replace(initialStar,"").replace(initialSpaces,"");
    }
    var wildcardRight = false;
    if (k.match(finalStar) !== null) {
      wildcardRight = true;
      k = k.replace(finalStar,"").replace(finalSpaces,"");
    }
    k = k
      .replace(allNonAlpha," ")
      .replace(allMultiSpace," ")
      .replace(initialSpaces,"")
      .replace(finalSpaces,"");
    var regBody = (wildcardLeft ? "[^ ]*" : "( |^)") + k + (wildcardRight ? "[^ ]*" : "( |$)");
    var regExp = fixedCase ? (new RegExp(regBody)) : (new RegExp(regBody,"i"));
    return regExp;
  });

}

function matchesKeywordREs(tweet,keywordREs) {
  var text = tweet.text
    .replace(allNonAlpha," ")
    .replace(allMultiSpace," ")
    .replace(initialSpaces,"")
    .replace(finalSpaces,"");
  for (var i=0; i<keywordREs.length; i+=1) {
    var re = keywordREs[i];
    if (text.match(re) !== null) {
      return true;
    }
  }
  return false;
}

var userListCache = {};
function matchesUsers(tweet,_userList) {
  var userList = nullFallback(_userList,"");
  var userArray = userListCache[userList];
  if (!def(userArray)) {
    userArray = userList.replace(allNonAlpha,"").split(",");
    if (userArray.length === 1 && userArray[0] === "") {
      userArray = new Array();
    }
    userListCache = {};
    userListCache[userList] = userArray;
  }
  for (var i=0; i<userArray.length; i+=1) {
    var user = userArray[i];
    if (user.toLowerCase() === tweet.user.screen_name.toLowerCase()) {
      return true;
    }
  }
  return false;
}
*/

//React / Redux connection and render
const store = createStore(app);
const VisibleApp = connect(mapStateToProps,mapDispatchToProps)(App);
ReactDOM.render(
  <Provider store={store}><VisibleApp /></Provider>,
  document.getElementById('content')
);

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
  request,
  Twitter
} from 'wircho-web-utilities';

//Settings
RequestHelpers.use(RequestFrontEndHelpers);

const ACTIONS = {
  ADD_TWEET:"ADD_TWEET", // tweet
  UPDATE_TWEET_HTML:"UPDATE_TWEET_HTML", // id_str, html
  UPDATE_TEXT:"UPDATE_TEXT", // propKey, text
  LOGGED_IN:"LOGGED_IN", // no params
  GOT_REQUEST_TOKEN:"GOT_REQUEST_TOKEN"
}

//Globals
var base_url = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;
console.log("base: " + base_url);

// Redux model
/*
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
  error:...
}
*/

// Actions creators
//const startLoading = ()=>({type:ACTIONS.START_LOADING});

// Reducer
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
}
function app(state,action) {
  if (!def(state)) {
    return initialState
  }
  switch (action.type) {
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
    case ACTIONS.UPDATE_TEXT:
      var json = {};
      json[action.propKey] = action.text;
      return mutate(
        state,
        json
      );
    break;
    default:
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
  updateText: (propKey,text) => {
    dispatch({type:ACTIONS.UPDATE_TEXT, propKey, text});
  }
});

//React classes
const App = React.createClass({
  render: function() {
    if (def(this.props.error)) {
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
        updateText={this.props.updateText}
      />;
    }
  }
});

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

const NeedsLogIn = React.createClass({
  componentDidMount: function() {
    loadTwitterAppAuthorization(this.props.request_token);
  },
  render: function() {
    return <div/>;
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

const ActualApp = React.createClass({
  componentDidMount: function() {
    beginLoading();
  },
  render: function() {
    var normalTweets = new Array();
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
        <div id="lefty">
          <p>Normal Tweets</p>
          <FilterInput
            buttonTitle="Update Keyword List"
            propKey="keywordList"
            defaultsPropKey="defaultsKeywordList"
            text={this.props.keywordList}
            defaultsText={this.props.defaultsKeywordList}
            updateText={this.props.updateText}
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
            updateText={this.props.updateText}
          />
          {importantTweets}
        </div>
      </div>
    )
  }
});

/*

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/hashtag/Overusing?src=hash">#Overusing</a> <a href="https://twitter.com/hashtag/hashtags?src=hash">#hashtags</a> can be <a href="https://twitter.com/hashtag/super?src=hash">#super</a> <a href="https://twitter.com/hashtag/annoying?src=hash">#annoying</a> 😩 Sticking to one or two per Tweet is a good call 😀</p>&mdash; Twitter Support (@Support) <a href="https://twitter.com/Support/status/613308058094039043">June 23, 2015</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

*/

const FilterInput = React.createClass({
  handleChange: function(e) {
    this.props.updateText(this.props.propKey,e.target.value);
  },
  handleClickUpdate: function() {
    defaults.set(this.props.propKey,this.props.text);
    this.textarea.focus();
    this.props.updateText(this.props.defaultsPropKey,this.props.text);
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
      request("GET",base_url + "/twitter/oembed","json").setParam("url",url).onLoad(function(info) {
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
      var htmlJSON = {__html:this.props.embed_html};
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
      store.dispatch({type:ACTIONS.UPDATE_TEXT, propKey:"error", text:info.request.response.error});
      //},15000);
    } else if (!def(info.request.response.logged_in)) {
      // console.log("AUTH STATUS OBTAINED: ERROR Bad auth_status answer");
      // setTimeout(function(){
      store.dispatch({type:ACTIONS.UPDATE_TEXT, propKey:"error", text:"Bad auth_status answer"});
      // },15000);
    } else if (info.request.response.logged_in) {
      // console.log("AUTH STATUS OBTAINED: LOGGED IN!");
      // setTimeout(function(){
      store.dispatch({type:ACTIONS.LOGGED_IN});
      // },15000);
    } else if (!def(info.request.response.request_token)) {
      // console.log("AUTH STATUS OBTAINED: ERROR No request token");
      // setTimeout(function(){
      store.dispatch({type:ACTIONS.UPDATE_TEXT, propKey:"error", text:"No request token"});
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
    store.dispatch({type:ACTIONS.UPDATE_TEXT, propKey:"error", text:"Error loading auth_status URL."});
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
  }).send();
}

const onlySymbols = /^[^a-zA-Z0-9_]*$/;
const allNonAlpha = /[^a-zA-Z0-9_,]/g;
const allNonAlpha_Space_Star_Exc = /[^a-zA-Z0-9_ \*!]/g;
const allMultiSpace = /[ ]{2,}/g;
const initialSpaces = /^[ ]+/;
const finalSpaces = /[ ]+$/;
const initialExc = /^!/;
const initialStar = /^\*/;
const finalStar = /\*$/;

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

//React / Redux connection and render
const store = createStore(app);
const VisibleApp = connect(mapStateToProps,mapDispatchToProps)(App);
ReactDOM.render(
  <Provider store={store}><VisibleApp /></Provider>,
  document.getElementById('content')
);

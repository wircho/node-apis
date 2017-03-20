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
  UPDATE_TEXT:"UPDATE_TEXT" // propKey, text
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
  defaultsImportantUserList:"..."
}
*/

// Actions creators
//const startLoading = ()=>({type:ACTIONS.START_LOADING});

// Reducer
var _kl = defaults.get("keywordList");
var _iul = defaults.get("importantUserList");
const initialState = {
  keywordList:_kl,
  importantUserList:_iul,
  defaultsKeywordList:_kl,
  defaultsImportantUserList:_iul
};
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
    case ACTIONS.UPDATE_TEXT:
      var json = {};
      json[action.propKey] = action.text;
      return mutate(
        state,
        json
      );
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
    if (def(this.props.embed_html)) {
      var htmlJSON = {__html:this.props.embed_html};
      return (<div dangerouslySetInnerHTML={htmlJSON}/>);
    } else {
      return (<div><blockquote><p>{this.props.tweet.text}</p>&mdash; {this.props.tweet.user.name} (@{this.props.tweet.user.screen_name})</blockquote></div>)
    }
  }
});

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

function matchesKeywords(tweet,_keywordList) {
  var keywordList = nullFallback(_keywordList,"");
  return true;
}

var userListCache = {};
function matchesUsers(tweet,_userList) {
  var userList = nullFallback(_userList,"");
  var userArray = userListCache[userList];
  if (!def(userArray)) {
    userArray = userList.replace(/[^a-zA-Z0-9_,]/,"").split(",");
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

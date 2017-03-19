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
  rotate
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
}
*/

// Actions creators
//const startLoading = ()=>({type:ACTIONS.START_LOADING});

// Reducer
const initialState = {};
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
});

//React classes
const App = React.createClass({
  componentDidMount: function() {
    beginLoading();
  },
  render: function() {
    var tweetDivs = new Array();
    var tweets = fallback(this.props.tweets,new Array());
    for (var i = tweets.length - 1; i>=0; i-=1) {
      var id_str = tweets[i];
      var tweet = this.props.tweet_jsons[id_str];
      var embed_html = fallback(this.props.tweet_embed_htmls,{})[id_str];
      console.log("tweet id_str: " + id_str);
      console.log("tweet tweet: " + tweet);
      console.log("tweet embed_html: " + embed_html);
      tweetDivs.push(<Tweet key={id_str} tweet={tweet} embed_html={embed_html}/>);
    }
    return (
      <div id="inner-content">
        {tweetDivs}
      </div>
    )
  }
});

/*

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/hashtag/Overusing?src=hash">#Overusing</a> <a href="https://twitter.com/hashtag/hashtags?src=hash">#hashtags</a> can be <a href="https://twitter.com/hashtag/super?src=hash">#super</a> <a href="https://twitter.com/hashtag/annoying?src=hash">#annoying</a> 😩 Sticking to one or two per Tweet is a good call 😀</p>&mdash; Twitter Support (@Support) <a href="https://twitter.com/Support/status/613308058094039043">June 23, 2015</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

*/

const Tweet = React.createClass({
  componentDidMount: function() {
    //return;
    //console.log(RequestFrontEndHelpers);
    var id_str = this.props.tweet.id_str;
    var url = "https://twitter.com/" + this.props.tweet.user.screen_name + "/status/" + id_str;
    request("GET",base_url + "/twitter/oembed","json").setParam("url",url).onLoad(function(info) {
      if (def(info.request.response) && def(info.request.response.html)) {
        store.dispatch({type:ACTIONS.UPDATE_TWEET_HTML, id_str:id_str, html:info.request.response.html});
      }
      console.log("oembed response:");
      console.log(info.request.response);
    }.bind(this)).send();
  },
  componentDidUpdate: function(prevProps) {
    if (def(this.props.embed_html) && !def(prevProps.embed_html)) {
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

//React / Redux connection and render
const store = createStore(app);
const VisibleApp = connect(mapStateToProps,mapDispatchToProps)(App);
ReactDOM.render(
  <Provider store={store}><VisibleApp /></Provider>,
  document.getElementById('content')
);

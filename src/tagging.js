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
  UPDATE_CLARIFAI_RESPONSE: "UPDATE_CLARIFAI_RESPONSE", // response (could be undefined)
  UPDATE_GOOGLE_RESPONSE: "UPDATE_GOOGLE_RESPONSE", // response (could be undefined)
  UPDATE_IMAGE: "UPDATE_IMAGE" // url (could be undefined)
}

//Globals
var base_url = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;

// Redux model:
/*
{
  clarifai_response:...
  google_response:...
  image:...
}
*/

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
      break;
    case ACTIONS.UPDATE_GOOGLE_RESPONSE:
      if (def(action.response)) {
        return mutate(state, {google_response: action.response});
      } else {
        return remove(state, "google_response");
      }
      break;
    case ACTIONS.UPDATE_IMAGE:
      if (def(action.url)) {
        return mutate(state, {image: action.url});
      } else {
        return remove(state, "image");
      }
      break;
    default: return state;
    break;
  }
}

// Map state to props
const mapStateToProps = state=>state;

const mapDispatchToProps = (dispatch) => ({
  getClarifaiTags: (url) => {
    dispatch({type: ACTIONS.UPDATE_CLARIFAI_RESPONSE, response: "Loading..."});
    var rurl = base_url + "/clarifai/tags?url=" + encodeURIComponent(url);
    var r = request("GET",rurl,"json");
    r.onLoad((info) => {
      dispatch({type: ACTIONS.UPDATE_CLARIFAI_RESPONSE, response: info.request.response});
    }).send();
  },
  getGoogleTags: (url) => {
    dispatch({type: ACTIONS.UPDATE_GOOGLE_RESPONSE, response: "Loading..."});
    var rurl = base_url + "/google-vision/tags?url=" + encodeURIComponent(url);
    var r = request("GET",rurl,"json");
    r.onLoad((info) => {
      dispatch({type: ACTIONS.UPDATE_GOOGLE_RESPONSE, response: info.request.response});
    }).send();
  },
  updateImage: (url) => {
    dispatch({type: ACTIONS.UPDATE_IMAGE, url})
  }
});

//React classes
const App = React.createClass({
  render: function() {
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

const ActualApp = React.createClass({
  render: function() {
    return <div>
      <Input updateImage={this.props.updateImage} getClarifaiTags={this.props.getClarifaiTags} getGoogleTags={this.props.getGoogleTags}/>
      <DowloadedImage image={this.props.image}/>
      <ClarifaiTags response={this.props.clarifai_response}/>
      <GoogleTags response={this.props.google_response}/>
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

const ClarifaiTags = React.createClass({
  render: function() {
    if (!def(this.props.response)) { return null; }

    const title = "Clarifai Tags:";
    var response = this.props.response;
    
    if (isstring(response)) { return (<div><h3>{title} {response}</h3></div>); }
    
    var concepts = (def(response.outputs) && response.outputs.length > 0 && def(response.outputs[0].data) && def(response.outputs[0].data.concepts)) ? response.outputs[0].data.concepts : undefined;
    
    if (!def(concepts)) {
      return (<div>
        <h3>{title}</h3>
        <div>Error: No tags.</div>
      </div>);
    }

    var tagElements = [];
    for (var i=0; i<concepts.length; i+=1) {
      var cpt = concepts[i];
      tagElements.push(<div key={i}>{cpt.name}: {cpt.value}</div>);
    }
    
    return (<div>
      <h3>{title}</h3>
      <div>{tagElements}</div>
    </div>);
  }
});

const GoogleTags = React.createClass({
  render: function() {
    if (!def(this.props.response)) { return null; }

    const title = "Google Tags:";
    var response = this.props.response;
    
    if (isstring(response)) { return (<div><h3>{title} {response}</h3></div>); }
    
    var labels = (response.constructor === Array && response.length > 0) ? response : undefined;
    
    if (!def(labels)) {
      return (<div>
        <h3>{title}</h3>
        <div>Error: No tags.</div>
      </div>);
    }

    var tagElements = [];
    for (var i=0; i<labels.length; i+=1) {
      var lbl = labels[i];
      tagElements.push(<div key={i}>{lbl.desc}: {lbl.score}</div>);
    }
    return (<div>
      <h3>{title}</h3>
      <div>{tagElements}</div>
    </div>);
        
  }
});

//React / Redux connection and render
const store = createStore(app);
const VisibleApp = connect(mapStateToProps,mapDispatchToProps)(App);
ReactDOM.render(
  <Provider store={store}><VisibleApp /></Provider>,
  document.getElementById('content')
);

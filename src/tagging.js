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
  UPDATE_IMAGE: "UPDATE_IMAGE", // url (could be undefined)
  UPDATE_IMAGE_SIZE: "UPDATE_IMAGE_SIZE", // width, height
  UPDATE_GOOGLE_FACES: "UPDATE_GOOGLE_FACES", // faces
  UPDATE_AZURE_FACES: "UPDATE_AZURE_FACES", // faces
  GROUP_AZURE_FACES: "GROUP_AZURE_FACES"
}

//Globals
var base_url = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port;

// Redux model:
/*
{
  clarifai_response:...
  google_response:...
  image:...
  image_size:{width: , height: }
  google_faces:...
  azure_faces:...
  session_azure_face_ids:[ face ids ],
  session_azure_faces: {
    faceId0: {imageURL:..., faceRectangle:...},
    faceId1: ...
  },
  session_image_sizes: {
    imageURL0: {width:, height:},
    imageURL1: ....
  }
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
    case ACTIONS.UPDATE_IMAGE_SIZE:
      if (def(action.width) && def(action.height) && def(action.url)) {
        var size = {width: action.width, height: action.height};
        var finalState = state;
        if (!def(finalState.session_image_sizes) || !def(finalState.session_image_sizes[action.url])) {
          var mutation = {};
          mutation[action.url] = size;
          finalState = mutate(finalState, {session_image_sizes: mutate(fallback(finalState.session_image_sizes, {}), mutation)});
        }
        return mutate(finalState, {image_size: size});
      } else {
        return remove(state, "image_size");
      }
      break;
    case ACTIONS.UPDATE_GOOGLE_FACES:
      if (def(action.faces)) {
        return mutate(state, {google_faces: action.faces});
      } else {
        return remove(state, "google_faces");
      }
      break;
    case ACTIONS.UPDATE_AZURE_FACES:
      if (def(action.faces)) {
        var finalState = state;
        for (var i=0; i<action.faces.length; i+=1) {
          var face = action.faces[i];
          if (!def(finalState.session_azure_faces) || !def(finalState.session_azure_faces[face.faceId])) {
            var mutation = {};
            mutation[face.faceId] = {imageURL: action.url, faceRectangle: face.faceRectangle};
            finalState = mutate(
              finalState,
              {
                session_azure_faces: mutate(
                  fallback(finalState.session_azure_faces, {}),
                  mutation
                ),
                session_azure_face_ids: fallback(finalState.session_azure_face_ids, []).concat([face.faceId])
              }
            );
          }
        }
        return mutate(finalState, {azure_faces: action.faces});
      } else {
        return remove(state, "azure_faces");
      }
      break;
    case ACTIONS.GROUP_AZURE_FACES:
      if (def(action.grouping) && (def(action.grouping.groups) || def(action.grouping.messyGroup))) {
        var gs = fallback(action.grouping.groups, []);
        var mg = fallback(action.grouping.messyGroup, []);
        return mutate(state, {session_azure_face_ids: gs.concat(mg)});
      } else {
        return state;
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
    request("GET",rurl,"json").onLoad((info) => {
      dispatch({type: ACTIONS.UPDATE_CLARIFAI_RESPONSE, response: info.request.response});
    }).send();
  },
  getGoogleTags: (url) => {
    dispatch({type: ACTIONS.UPDATE_GOOGLE_RESPONSE, response: "Loading..."});
    var rurl = base_url + "/google-vision/tags?url=" + encodeURIComponent(url);
    request("GET",rurl,"json").onLoad((info) => {
      dispatch({type: ACTIONS.UPDATE_GOOGLE_RESPONSE, response: info.request.response});
    }).send();
  },
  getGoogleFaces: (url) => {
    dispatch({type: ACTIONS.UPDATE_GOOGLE_FACES});
    var rurl = base_url + "/google-vision/faces?url=" + encodeURIComponent(url);
    request("GET",rurl,"json").onLoad((info) => {
      dispatch({type: ACTIONS.UPDATE_GOOGLE_FACES, faces: info.request.response});
    }).send();
  },
  getAzureFaces: (url) => {
    dispatch({type: ACTIONS.UPDATE_AZURE_FACES});
    var rurl = base_url + "/azure/faces/detect?url=" + encodeURIComponent(url);
    request("GET",rurl,"json").onLoad((info) => {
      dispatch({type: ACTIONS.UPDATE_AZURE_FACES, faces: info.request.response, url});
    }).send();
  },
  groupFaces: (ids) => {
    var array = [];
    for (var i=0; i<ids.length; i+=1) {
      var id = ids[i];
      if (id.constructor === Array) {
        array = array.concat(id);
      } else {
        array = array.concat([id]);
      }
    }
    var rurl = base_url + "/azure/faces/group?ids=" + array.join(",");
    request("GET",rurl,"json").onLoad((info) => {
      dispatch({type: ACTIONS.GROUP_AZURE_FACES, grouping: info.request.response, url});
    }).send();
  },
  updateImage: (url) => {
    dispatch({type: ACTIONS.UPDATE_IMAGE, url})
  },
  updateImageSize: (dict) => {
    dispatch({type: ACTIONS.UPDATE_IMAGE_SIZE, url: dict.url, width: dict.width, height: dict.height})
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
      getGoogleFaces={this.props.getGoogleFaces}
      getAzureFaces={this.props.getAzureFaces}
      updateImage={this.props.updateImage}
      image={this.props.image}
      image_size={this.props.image_size}
      google_faces={this.props.google_faces}
      azure_faces={this.props.azure_faces}
      updateImageSize={this.props.updateImageSize}
      session_azure_face_ids={this.props.session_azure_face_ids}
      session_azure_faces={this.props.session_azure_faces}
      session_image_sizes={this.props.session_image_sizes}
      groupFaces={this.props.groupFaces} 
    />;
  }
});

const ActualApp = React.createClass({
  render: function() {
    return <div>
      <Input
        updateImage={this.props.updateImage}
        getClarifaiTags={this.props.getClarifaiTags}
        getGoogleTags={this.props.getGoogleTags}
        getGoogleFaces={this.props.getGoogleFaces}
        getAzureFaces={this.props.getAzureFaces}
        updateImageSize={this.props.updateImageSize}
      />
      <DowloadedImage
        image={this.props.image}
        image_size={this.props.image_size}
        google_faces={this.props.google_faces}
        azure_faces={this.props.azure_faces}
        updateImageSize={this.props.updateImageSize}
      />
      <ClarifaiTags response={this.props.clarifai_response}/>
      <GoogleTags response={this.props.google_response}/>
      <AzureFaces
        face_ids={this.props.session_azure_face_ids}
        faces={this.props.session_azure_faces}
        sizes={this.props.session_image_sizes}
        groupFaces={this.props.groupFaces} 
      />
    </div>
  }
});

const Input = React.createClass({
  getTags: function(event) {
    event.preventDefault();
    var url = $("#url").val();
    //this.props.updateImageSize({});
    //this.props.updateImage("");
    this.props.updateImage(url);
    this.props.getClarifaiTags(url);
    this.props.getGoogleTags(url);
    this.props.getGoogleFaces(url);
    this.props.getAzureFaces(url);
  },
  render: function() {
    return <div>
      Enter Image URL:
      <input type="text" id="url"/>
      <input type="button" onClick={this.getTags} value="Get Tags"/>
    </div>;
  }
});

function getGoogleBox(info, width, height, cls, key) {
  var xs = info.map((p) => p.x);
  var ys = info.map((p) => p.y);
  var minX = Math.min.apply(null, xs);
  var maxX = Math.max.apply(null, xs);
  var minY = Math.min.apply(null, ys);
  var maxY = Math.max.apply(null, ys);
  var style = {
    left: "" + (minX * 100 / width) + "%",
    top: "" + (minY * 100 / height) + "%",
    width: "" + ((maxX - minX)* 100 / width) + "%",
    height: "" + ((maxY - minY)* 100 / height) + "%"
  };
  return <div className={cls} style={style} key={key}/>
}

function getAzureBox(info, width, height, cls, key) {
  var style = {
    left: "" + (info.left * 100 / width) + "%",
    top: "" + (info.top * 100 / height) + "%",
    width: "" + (info.width * 100 / width) + "%",
    height: "" + (info.height * 100 / height) + "%"
  };
  return <div className={cls} style={style} key={key}/>
}

const DowloadedImage = React.createClass({
  onImgLoad: function({target: img}) {
    console.log("LOADED IMAGE!");
    this.props.updateImageSize({url: img.src, width: img.naturalWidth, height: img.naturalHeight});
  },
  render: function() {
    var faceElements = [];
    if (def(this.props.image_size)
    && def(this.props.image_size.width)
    && def(this.props.image_size.height)
    && this.props.image_size.width > 0
    && this.props.image_size.height > 0) {
      var width = this.props.image_size.width;
      var height = this.props.image_size.height;
      if (def(this.props.google_faces) && this.props.google_faces.constructor === Array && this.props.google_faces.length > 0) {
        for (var i=0; i<this.props.google_faces.length; i+=1) {
          var google_face = this.props.google_faces[i];
          if (!def(google_face.bounds)) { continue; }
          var head = google_face.bounds.head;
          var face = google_face.bounds.face;
          if (def(head)) {
            faceElements.push(getGoogleBox(head, width, height, "google-head", "google-head" + i));
          }
          if (def(face)) {
            faceElements.push(getGoogleBox(face, width, height, "google-face", "google-face" + i));
          }
        }
      }
      if (def(this.props.azure_faces) && this.props.azure_faces.constructor === Array && this.props.azure_faces.length > 0) {
        for (var i=0; i<this.props.azure_faces.length; i+=1) {
          var azure_face = this.props.azure_faces[i];
          if (!def(azure_face.faceRectangle)) { continue; }
          faceElements.push(getAzureBox(azure_face.faceRectangle, width, height, "azure-face", "azure-face" + i));
        }
      }
    }
    return <div><div id="image-wrapper"><img className="main-image" onLoad={this.onImgLoad} src={this.props.image}/>{faceElements}</div></div>
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

function afSubtitle(count) {
  if (count == -1) { return (<h4 key="group-uncat">Uncategorized</h4>) }
  return (<h4 key={"group-" + count}>Group {count}</h4>);
}

function afFace(id, face, size) {
  var boxSide = 100.0;
  var center = {
    x: face.faceRectangle.left + face.faceRectangle.width / 2.0,
    y: face.faceRectangle.top + face.faceRectangle.height / 2.0
  }
  var side = Math.max(face.faceRectangle.width, face.faceRectangle.height);
  var scale = boxSide / side;
  var imageSize = {
    width: size.width * scale,
    height: size.height * scale
  }
  var boxCenter = {
    x: center.x * scale,
    y: center.y * scale
  }
  var imageOffset = {
    x: -boxCenter.x + boxSide / 2.0,
    y: -boxCenter.y + boxSide / 2.0
  }
  var boxStyle = {
    position: "relative",
    display: "inline-block",
    width: boxSide,
    height: boxSide,
    overflow: "hidden"
  }
  var imageStyle = {
    position: "absolute",
    top: imageOffset.y,
    left: imageOffset.x,
    width: imageSize.width,
    height: imageSize.height
  }
  return (<div key={id}>
    <div style={boxStyle}><img src={face.imageURL} style={imageStyle}/></div>
  </div>);
}

const AzureFaces = React.createClass({
  groupFaces: function(event) {
    event.preventDefault();
    this.props.groupFaces(this.props.face_ids);
  },
  render: function() {
    if (!def(this.props.face_ids) || !def(this.props.faces) || !def(this.props.sizes)) { return null }

    const title = "Azure Faces:";

    var faceElements = [];

    var groupCounter = 0;
    var inUncategorized = false;
    for (var i=0; i<this.props.face_ids.length; i+=1) {
      var ids = this.props.face_ids[i];
      if (ids.constructor === Array) {
        faceElements.push(afSubtitle(groupCounter));
        groupCounter += 1;
        for (var j=0; j<ids.length; j+=1) {
          var id = ids[j];
          var face = this.props.faces[id];
          var size = this.props.sizes[face.imageURL]
          if (def(face) && def(size)) {
            faceElements.push(afFace(id, face, size));
          }
        }
      } else {
        if (!inUncategorized) {
          inUncategorized = true;
          faceElements.push(afSubtitle(-1));
        }
        var face = this.props.faces[ids];
        var size = this.props.sizes[face.imageURL];
        if (def(face) && def(size)) {
          faceElements.push(afFace(ids, face, size));
        }
      }
    }

    return (<div>
      <h3>{title}</h3>
      <div>{faceElements}</div>
      <div><input type="button" value="Group Faces" onClick={this.groupFaces}/></div>
    </div>);
  }
})

//React / Redux connection and render
const store = createStore(app);
const VisibleApp = connect(mapStateToProps,mapDispatchToProps)(App);
ReactDOM.render(
  <Provider store={store}><VisibleApp /></Provider>,
  document.getElementById('content')
);

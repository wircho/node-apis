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

const ACTIONS = {
  //START_LOADING:"START_LOADING", // No params
}

// Redux model
/*
Example
{
  loading: Boolean
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
    // case ACTIONS.START_LOADING:
    //   return mutate(state,{loading:true});
    //   break;
    default:;
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
  render: function() {
    return (
      <div id="inner-content">
        Hello World!
      </div>
    )
  }
});

//React / Redux connection and render
const store = createStore(app);
const VisibleApp = connect(mapStateToProps,mapDispatchToProps)(App);
ReactDOM.render(
  <Provider store={store}><VisibleApp /></Provider>,
  document.getElementById('content')
);

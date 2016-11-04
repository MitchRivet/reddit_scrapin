require('normalize.css/normalize.css');
require('styles/App.css');
var ReactD3 = require('react-d3-components');
var ScatterPlot = ReactD3.ScatterPlot;
var _ = require('lodash');

import { TagCloud } from "react-tagcloud";

var data = require('json!./../../../hilary_says_donald_wants.json');
var string = JSON.stringify(data);

import React from 'react';


//foreach in data.comments,
const plot = _.take(_.map(data.comments, (c) => {return {x: c.score.score, y: c.sentAvg}}), 100);
console.log(plot);

const scatterData = [
    {
    label: 'somethingA',
    values: plot
    }
];

const divStyle = {
  background: 'white'
};
const header = {
  textAlign: 'center',
  fontSize: '48'
};

const title = {
  textAlign: 'center',
  color: 'black',
  marginBottom: '20',
  marginTop: '20',
  fontSize: '36'
};

class AppComponent extends React.Component {
  render() {
    return (
      <div className="index">
        <div style={header}><strong>Reddit Sentiment Analysis</strong></div>
        <br/>
        <div style={header}>{data.title}</div>
        <div className="notice" style={ divStyle }>
          <div style={title}>WordCloud</div>

          <TagCloud minSize={12} maxSize={48} tags={data.wordCloud}/>
          <div style={title}>scatterPlot</div>
          <ScatterPlot
                data={scatterData}
                width={800}
                height={800}
                margin={{top: 50, bottom: 50, left: 50, right: 50}}
                xAxis={{label: "comment sentiment"}}
                yAxis={{label: "user sentiment"}}/>

        </div>
      </div>
    );
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;

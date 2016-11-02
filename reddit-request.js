'use strict';
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var sentiment = require('sentiment');

var app = express();

// const https = require('https');

// https.get('https://www.reddit.com/r/politics/comments/5alotj/texas_agriculture_commissioner_calls_hillary/.json', (res) => {
//   console.log(res.data);
// });

function *findReplies(comment) {
  if (!comment) {return ;}

  for (var i = 0; i<comment.length; i++) {
    var commentMeta = comment[i].data;

    yield {
      author: commentMeta.author,
      body: commentMeta.body
    };

    if (commentMeta.replies) {
      yield *findReplies(commentMeta.replies.data.children);
    }
  }
}

app.get('/scrape', (req, res) => {
  var url = 'https://www.reddit.com/r/politics/comments/5alotj/texas_agriculture_commissioner_calls_hillary/.json';
  var allComments = [];
  request(url, (err, response, html) => {
    let commentJSON = JSON.parse(response.body);
    var header = response.body[0];
    var comments = commentJSON[1].data.children;

    var getReply = findReplies(comments);
    var replyGrab = getReply.next();

    while (!replyGrab.done) {
      allComments.push(replyGrab.value);
      replyGrab = getReply.next();
    }
    // for (i=0; i<comments.length; i++) {
    //   let comment = comments[i].data;
    //   flatComments.push({
    //     body: comment.body,
    //     author: comment.author
    //   });
    //
    //   if (comment.replies) {
    //     findChildren(comment);
    //   }
    // }

    res.json(allComments);
  });
});

app.listen('8081')

console.log('Magic happens on port 8081');

exports = module.exports = app;

'use strict';
var express = require('express');
// var fs = require('fs');
var jsonfile = require('jsonfile');
var request = require('request');
var _ = require('lodash');
var sentiment = require('sentiment');
var Promise = require("bluebird");
var async = require('async');
// var WordPOS = require('wordpos'),
//     wordpos = new WordPOS();

var eliminate = ['the', 'a', 'and', 'of', 'to', 'is', 'that',
                'this', 'not', 'he', 'just', 'for', 'on', 'you',
                'his', 'in', 'it', 'be', 'was', 'are', 'It', 'He',
                'they', 'we', 'but', 'with', 'We', 'as', 'do', 're',
                'so', 'https', 'or', 'com', 'have', 'can', 'from', 'what',
                'by', 'at', 'their', 'an', 'all', 'about', 'out', 'who',
                'there', 'here', 'then'];

var app = express();

var allWordsString = "";
var a = 'a'

function *findReplies(comment) {
  if (!comment) {return ;}

  for (var i = 0; i<comment.length; i++) {
    var commentMeta = comment[i].data;

    if (commentMeta.body && commentMeta.author !== "[deleted]") {
      allWordsString = allWordsString + commentMeta.body + '';
      var score = sentiment(commentMeta.body);

      yield {
        author: commentMeta.author,
        body: commentMeta.body,
        score: score
      };
    }

    //to-do: check banned, distinguished

    if (commentMeta.replies) {
      yield *findReplies(commentMeta.replies.data.children);
    }
  }
}

app.get('/scrape', (req, res) => {
  var url = 'https://www.reddit.com/r/politics/comments/5dguee/megyn_kelly_fox_news_had_to_explain_to_trump/.json';
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

    if (replyGrab.done) {
      console.log('comments separated');
      var pattern = /\w+/g;
      var matchedWords = allWordsString.match( pattern );

      //using reduce to get the words we need
      var counts = matchedWords.reduce(function ( stats, word ) {
                      if ( stats.hasOwnProperty( word ) ) {
                          stats[ word ] = stats[ word ] + 1;
                      } else {
                          stats[ word ] = 1;
                      }
                      return stats;
                  }, {} );

      var wordCloud = _.take(_.orderBy(_.reduce(counts, (res, v, k) => {
            if (!_.includes(eliminate, k.toLowerCase()) && k.length > 3) {
              res.push({ value: k, count: v});
            }
            return res;
      }, []), 'count', 'desc'), 20);

      let cleanComments = _.without(allComments, {});

      async.map(cleanComments, (c, callback) => {
        let authorUrl = 'https://www.reddit.com/user/' + c.author + '/comments/.json';

        request(authorUrl, (err, response, html) => {
          if (err) {
            console.log(err);
          } else {
            let authorJSON = JSON.parse(response.body);

            let authorComments = authorJSON.data.children;

            let sentArray = _.map(authorComments, (c) => {
              let commentSent = sentiment(c.data.body);
              return commentSent.score;
            });

            let sentAvg = _.sum(sentArray) / sentArray.length;
            c.sentAvg = sentAvg;
            callback(err, c)
          }
        })
      }, (err, result) => {
        let output = {title: 'Megyn Kelly', comments: result, wordCloud: wordCloud};

        jsonfile.spaces = 4;
        jsonfile.writeFile('megyn_kelly.json', output, (err) => {
          if (err) {
            console.log(err);
          } else {
          console.log('json file written');
          }
        });

        res.json(output);
      });
    }
  });
});

app.listen('8081')

console.log('Listening on port 8081');

exports = module.exports = app;

var beams = require('beams');
var talks = {};

function getTalk(id) {
  var talk = talks[id];
  if (!talk) {
    talk = talks[id] = {
      id: id,
      subscribers: []
    };
  }
  return talk;
}

var sly = module.exports = function () {

  beams.on('sly:subscribe', function (talkId, client) {
    var talk = getTalk(talkId);
    talk.subscribers.push(client);
  });

  beams.on('sly:state', function (state) {
    var talk = getTalk(state.talk);
    talk.subscribers.each(function (subscriber) {
      subscriber.emit(state);
    });
  });

};

sly.version = require('./package.json');

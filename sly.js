var beams = app.beams;
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
    if (client) {
      talk.subscribers.push(client);
    }
  });

  beams.on('sly:state', function (state) {
    var talk = getTalk(state.id);
    talk.subscribers.forEach(function (subscriber) {
      subscriber.emit('sly:state', state);
    });
  });

};

sly.version = require('./package.json');

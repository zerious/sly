var talks = {};
var polls = {};

function getTalk(id) {
  var talk = talks[id];
  if (!talk) {
    talk = talks[id] = {
      id: id,
      subscribers: [],
      polls: []
    };
  }
  return talk;
}

var sly = module.exports = function () {

  var beams = App.beams;

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

  beams.on('sly:join', function (email, client) {
    client.email = email;
    log.info('[Sly] User "' + client.email + '" has joined!');
  });

  beams.on('sly:vote', function (vote, client) {
    var talk = getTalk(vote.talk);
    var key = vote.talk + '#' + vote.poll;
    var poll = polls[key] = polls[key] || {};
    poll[client.email] = vote.choice;
    log.info('[Sly] User "' + (client.email || 'anonymous') + '" voted on "' + vote.poll + '" in "' + vote.talk + '".');
    var tally = {};
    for (var email in poll) {
      var choice = poll[email];
      tally[choice] = (tally[choice] || 0) + 1;
    }
    beams.each(function (client) {
      var data = {
        talk: vote.talk,
        id: vote.poll,
        tally: tally
      };
      client.emit('sly:poll', data);
    });
  });

};

/**
 * Expose the Sly version via package.json lazy loading.
 */
Object.defineProperty(sly, 'version', {
  get: function () {
    return require(__dirname + '/package.json').version;
  }
});
/**
 * Sly, Slide presentation framework.
 * Client side
 */

var slideCount = 0;
var slideIndex = -1;
var frameIndex = 0;
var lastFrame = 0;
var masterIndex = 0;
var currentSlide = null;
var currentFrame = null;
var isMaster = getCookie('m');
var isFollowing = !isMaster;
var hash = getHash();
var defaultHash = '0,0';
var talkId = location.href.replace(/(^.*?\/\/[^\/]+|#.*$)/g, '');
var beams = Beams();

// Set the client to master mode so others will follow.
if (hash == 'm') {
  isMaster = 1;
  isFollowing = 0;
  setCookie('m', 1);
  setHash(defaultHash);
}

// Unset master mode and become a slave.
if (hash == 's') {
  isMaster = 0;
  deleteCookie('m');
  setHash(defaultHash);
}

// Get the hash again because it might have changed.
hash = getHash() || defaultHash;

// Prepare the slides.
all('b', function (content, index) {
  wrapElement(content, 'u');
  slideCount++;
});

// Move to the slide and frame indicated in the URL's hash.
var pair = hash.split(',');
moveToSlide(pair[0] * 1);
moveToFrame(pair[1] * 1);

// When a user presses a key, maybe move to a new slide.
bind(window, 'keydown', function (element, event) {
  var key = event.keyCode;
  if (key == LEFT_KEY) {
    incrementFrame(-1);
    isFollowing = 0;
  }
  else if (key == RIGHT_KEY) {
    incrementFrame(1);
    isFollowing = 0;
  }
});

bind(window, 'resize', function () {
  var height = Math.min(window.innerHeight, window.innerWidth * 3 / 4);
  document.body.style.fontSize = Math.round(height / 15) + 'px';
});

trigger(window, 'resize');


function setHash(value) {
  location.replace(location.href.replace(/#.*$/, '') + '#' + value);
}

function getHash() {
  return location.hash.substr(1);
}

function incrementSlide(increment) {
  moveToSlide((slideIndex + slideCount + increment) % slideCount);
}

function incrementFrame(increment) {
  newIndex = frameIndex + increment;
  if (newIndex < 0) {
    incrementSlide(increment);
  }
  else if (frameIndex < lastFrame) {
    moveToFrame(newIndex);
  }
  else {
    incrementSlide(increment);
  }
}

function moveToSlide(newIndex) {
  if (newIndex != slideIndex) {
    slideIndex = newIndex;
    all('u', function (slide, index) {
      var isCurrent = (index == slideIndex);
      if (isCurrent) {
        currentSlide = slide;
        show(slide);
      }
      else {
        hide(slide);
      }
    });
    all(currentSlide, '*', function () {

    });
    frameIndex = -1;
    moveToFrame(0);
    setState();
  }
}

function hide(element) {
  removeClass(element, '_APPEAR');
  addClass(element, '_HIDDEN');
}

function show(element) {
  removeClass(element, '_HIDDEN');
  addClass(element, '_APPEAR');
}

function moveToFrame(newIndex) {
  lastFrame = 0;
  var found;
  frameIndex = newIndex;
  for (var i = 0; i <= newIndex; i++) {
    found = getLength(all(currentSlide, '.a' + i, show));
    found = found || getLength(all(currentSlide, '.d' + i + ',.o' + i, hide));
    if (found) {
      lastFrame = frameIndex;
    }
  }
  all(currentSlide, '.o' + i, hide);
  found = true;
  var hideFound = function (element) {
    hide(element);
    found = true;
    lastFrame = i;
  };
  var showFound = function (element) {
    show(element);
    found = true;
    lastFrame = i;
  };
  while (found) {
    found = false;
    all(currentSlide, '.a' + i + ',.o' + i, hideFound);
    all(currentSlide, '.d' + i, showFound);
    i++;
  }
  setState();
}

function setState() {
  setHash(slideIndex + ',' + frameIndex);
  if (isMaster) {
    beams._EMIT('sly:state', {
      id: talkId,
      slide: slideIndex,
      frame: frameIndex
    });
  }
}

beams._CONNECT(function () {
  if (!isMaster) {
    beams._EMIT('sly:subscribe', talkId);
  }
});

beams._ON('sly:state', function (state) {
  log('talk', talkId);
  log('state', state);
  log('isFollowing', isFollowing);
  if ((state.id == talkId) && isFollowing) {
    moveToSlide(state.slide);
    moveToFrame(state.frame);
  }
});

beams._ON('sly:poll', function (data) {
  log(data);
});

on('#_JOIN', 'click', function (element, event) {
  var email = getValue('_EMAIL');
  setCookie('email', email);
  beams._EMIT('sly:join', email);
});


on(document, 'input._CHOICE', 'click', function (element, event) {
  beams._EMIT('sly:vote', {
    talk: talkId,
    poll: element.name,
    choice: getValue(element)
  });
});

onReady(function (readyElement) {
  all(readyElement, 'b._POLL', function (poll) {
    all(poll, 'input', function (input, index) {
      addClass(input, '_CHOICE');
      setAttribute(input, 'value', index);
      setAttribute(input, 'name', poll.id);
    });
  });
});





















//

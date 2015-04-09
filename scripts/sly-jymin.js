/**
 * Sly, Slide presentation framework.
 * Client side
 *
 * @use jymin/jymin.js
 * @use beams/scripts/beams-jymin.js
 */
var Sly = window.Sly = function () {

  if (Sly._isReady) {
    return;
  }

  var slideCount = 0;
  var slideIndex = -1;
  var frameIndex = 0;
  var lastFrame = 0;
  var currentSlide = null;
  var isMaster = Jymin.getCookie('m');
  var isFollowing = !isMaster;
  var hash = getHash();
  var defaultHash = '0,0';
  var talkId = location.href.replace(/(^.*?\/\/[^\/]+|#.*$)/g, '');

  // Set the client to master mode so others will follow.
  if (hash == 'm') {
    isMaster = 1;
    isFollowing = 0;
    Jymin.setCookie('m', 1);
    setHash(defaultHash);
  }

  // Unset master mode and become a slave.
  if (hash == 's') {
    isMaster = 0;
    Jymin.deleteCookie('m');
    setHash(defaultHash);
  }

  // Get the hash again because it might have changed.
  hash = getHash() || defaultHash;

  // Move to the slide and frame indicated in the URL's hash.
  var pair = hash.split(',');
  moveToSlide(pair[0] * 1);
  moveToFrame(pair[1] * 1);

  // When a user presses a key, maybe move to a new slide.
  Jymin.bind(window, 'keydown', function (element, event) {
    var key = event.keyCode;
    if (key == 37) {
      incrementFrame(-1);
      isFollowing = 0;
    }
    else if (key == 39) {
      incrementFrame(1);
      isFollowing = 0;
    }
  });

  Jymin.bind(window, 'resize', function () {
    var size = Math.min(window.innerHeight / 9, window.innerWidth / 16);
    document.body.style.fontSize = Math.round(size / 2) + 'px';
  });

  Jymin.trigger(window, 'resize');


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
    // TODO: Re-enable animation frames.
    return incrementSlide(increment);
    var newIndex = frameIndex + increment;
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
      Jymin.all('s-slide', function (slide, index) {
        Jymin.flipClass(slide, '_slyHidden', Math.abs(index - slideIndex) > 1);
        Jymin.flipClass(slide, '_slyBefore', index < slideIndex);
        Jymin.flipClass(slide, '_slyAfter', index > slideIndex);
      });
      frameIndex = -1;
      moveToFrame(0);
      setState();
    }
  }

  function hide(element) {
    Jymin.removeClass(element, '_appear');
    Jymin.addClass(element, '_slyHidden');
  }

  function show(element) {
    Jymin.removeClass(element, '_slyHidden');
    Jymin.addClass(element, '_appear');
  }

  function moveToFrame(newIndex) {
    lastFrame = 0;
    var found;
    frameIndex = newIndex;
    for (var i = 0; i <= newIndex; i++) {
      found = Jymin.getLength(Jymin.all(currentSlide, '.a' + i, show));
      found = found || Jymin.getLength(Jymin.all(currentSlide, '.d' + i + ',.o' + i, hide));
      if (found) {
        lastFrame = frameIndex;
      }
    }
    Jymin.all(currentSlide, '.o' + i, hide);
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
      Jymin.all(currentSlide, '.a' + i + ',.o' + i, hideFound);
      Jymin.all(currentSlide, '.d' + i, showFound);
      i++;
    }
    setState();
  }

  function setState() {
    setHash(slideIndex + ',' + frameIndex);
    if (isMaster) {
      Beams._emit('sly:state', {
        id: talkId,
        slide: slideIndex,
        frame: frameIndex
      });
    }
  }

  Beams._on('connect', function () {
    if (!isMaster) {
      Beams._emit('sly:subscribe', talkId);
    }
  });

  Beams._on('sly:state', function (state) {
    if ((state.id == talkId) && isFollowing) {
      moveToSlide(state.slide);
      moveToFrame(state.frame);
    }
  });

  Beams._on('sly:poll', function (data) {
    //Jymin.log(data);
  });

  Jymin.on('#_join', 'click', function (element, event) {
    var email = Jymin.getValue('_email');
    Jymin.setCookie('email', email);
    Beams._emit('sly:join', email);
  });


  Jymin.on(document, 'input._tatChoice', 'change', function (element, event) {
    var vote = {
      talk: talkId,
      poll: element.name,
      choice: Jymin.getValue(element)
    };
    console.log(vote);
    Beams._emit('sly:vote', vote);
  });

  Jymin.all('s-slide', function (slide) {
    slide._index = slideCount++;
    setTimeout(function () {
      Jymin.addClass(slide, '_slyReady');
    }, 99);
  });

  Jymin.on('._tatChoice,iframe,label', 'focus', function (element) {
    element.blur();
  });

  Jymin.on('s-slide', 'mouseup,touchend', function (slide) {
    console.log(slide._index);
  });

  /*
  Jymin.onReady(function (readyElement) {
    Jymin.all(readyElement, 'b._poll', function (poll) {
      Jymin.all(poll, 'input', function (input, index) {
        Jymin.addClass(input, '_choice');
        Jymin.setAttribute(input, 'value', index);
        Jymin.setAttribute(input, 'name', poll.id);
      });
    });
  });
  */

  Sly._isReady = 1;
};

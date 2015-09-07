function domReady() {
  document.body.className += "javascript";

  preventPullToRefresh();
  setupNavigation();

  queue()
    .defer(parseJSON, 'data/questions.json')
    .defer(parseCSV, 'data/students.csv')
    .await(initialize);

  function initialize(error, questions, students) {
    if (error) {
      console.log(error);
      return;
    }

    // Instruction page
    populateHeader(questions.title, questions.code);
    populateInstructions(questions.problem, questions.instructions);

    // Checklist page
    addStudentListHandler(students, '.student-selector .selector');
  }

  function preventPullToRefresh() {
    var maybePreventPullToRefresh = false;

    var touchstartHandler = function(e) {
      if (e.touches.length !== 1) return;
      lastTouchY = e.touches[0].clientY;
      maybePreventPullToRefresh = window.pageYOffset === 0;
    };

    var touchmoveHandler = function(e) {
      var touchY = e.touches[0].clientY;
      var touchYDelta = touchY - lastTouchY;
      lastTouchY = touchY;

      if (maybePreventPullToRefresh) {
        maybePreventPullToRefresh = false;
        if (touchYDelta > 0) {
          e.preventDefault();
          return;
        }
      }
    };

    document.addEventListener('touchstart', touchstartHandler, false);
    document.addEventListener('touchmove', touchmoveHandler, false);
  }

  function setupNavigation() {
    var navGroup = document.querySelectorAll('nav a');
    var pageGroup = document.querySelectorAll('.page');

    var bookmark = window.location.hash;
    if (bookmark && bookmark[0] === '#') {
      var selectedLink = document.querySelector('a[name="' + bookmark.substr(1) + '-link"]');
      var selectedPage = document.querySelector('.page.' + bookmark.substr(1) + '-page');
      switchGroup(selectedLink, navGroup, 'active', false);
      switchGroup(selectedPage, pageGroup, 'hidden', true);
    }

    forEach(navGroup, function(index, link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var correspondingPage = document.querySelector('.page.' + link.getAttribute('href').substr(1) + '-page');
        switchGroup(link, navGroup, 'active', false);
        switchGroup(correspondingPage, pageGroup, 'hidden', true);
        window.location = link.getAttribute('href');
      });
    });
  }

  // Header
  function populateHeader(title, code) {
    document.querySelector('#title').innerHTML = title;
    document.querySelector('#code').innerHTML = code;
  }

  // Main Instructions
  function populateInstructions(problem, instructions) {
    document.querySelector('#main-problem').innerHTML = htmlNewline(htmlEscape(problem));
    document.querySelector('#main-instructions').innerHTML = htmlNewline(htmlEscape(instructions));
  }

  // Students List
  function populateStudentList(students) {
    var selectElem = document.querySelector('.student-selector .selector');
    forEach(students, function(index, student) {
      var optElem = document.createElement('option');
      optElem.innerHTML = htmlEscape(student[0] + ' | ' + student[1]);
      selectElem.appendChild(optElem);
    });
  }

  function addStudentListHandler(students, selector) {
    new autoComplete({
      selector: selector,
      minChars: 0,
      source: function(term, suggest) {
        term = term.toLowerCase();
        var choices = students;
        var suggestions = [];
        for (var i = 0; i < choices.length; ++i) {
          if (~(choices[i][0]+' '+choices[i][1]).toLowerCase().indexOf(term))
            suggestions.push(choices[i]);
        }
        suggest(suggestions);
      },
      renderItem: function(item, search) {
        search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
        return '<div class="autocomplete-suggestion" data-name="'+item[1]+'" data-code="'+item[0]+'" data-val="'+search+'"><span>('+item[0].replace(re, "<b>$1</b>")+')</span> <span>'+item[1].replace(re, "<b>$1</b>")+'</span></div>';
      },
      onSelect: function(e, term, item) {
        var input = document.querySelector(selector);
        input.value = item.getAttribute('data-name');
        input.setAttribute('data-code', item.getAttribute('data-code'));
      }
    });
  }

  /* switchGroup helper function: switching between a group of elements,
   * adding (or removing) className from the selected element in the group
   */

  function switchGroup(selectedElem, elemGroup, className, isReverse) {
    isReverse = isReverse || false;

    if (isReverse) {
      forEach(elemGroup, function(index, elem) { addClass(elem, className); });
      removeClass(selectedElem, className);
    } else {
      forEach(elemGroup, function(index, elem) { removeClass(elem, className); });
      addClass(selectedElem, className);
    }
  }

  /* file parsing methods */

  function parseJSON(path, callback) {
    var request = new XMLHttpRequest();
    request.open("GET", path, true);
    request.send(null);
    request.onreadystatechange = function() {
      if (request.readyState === 4 && request.status === 200) {
        var json = JSON.parse(request.responseText);
        if (json) callback(null, json);
        else callback("Error parsing json files.", null);
      }
    };
  }

  function parseCSV(path, callback) {
    var request = new XMLHttpRequest();
    request.open("GET", path, true);
    request.send(null);
    request.onreadystatechange = function() {
      if (request.readyState === 4 && request.status === 200) {
        var str = request.responseText;

        var arr = [];
        var quote = false;  // true means we're inside a quoted field

        // iterate over each character, keep track of current row and column (of the returned array)
        for (var row = 0, col = 0, c = 0; c < str.length; ++c) {
          var cc = str[c], nc = str[c+1];        // current character, next character
          arr[row] = arr[row] || [];             // create a new row if necessary
          arr[row][col] = arr[row][col] || '';   // create a new column (start with empty string) if necessary

          // If the current character is a quotation mark, and we're inside a
          // quoted field, and the next character is also a quotation mark,
          // add a quotation mark to the current column and skip the next character
          if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }

          // If it's just one quotation mark, begin/end quoted field
          if (cc == '"') { quote = !quote; continue; }

          // If it's a comma and we're not in a quoted field, move on to the next column
          if (cc == ',' && !quote) { ++col; continue; }

          // If it's a newline and we're not in a quoted field, move on to the next
          // row and move to column 0 of that new row
          if (cc == '\n' && !quote) { ++row; col = 0; continue; }

          // Otherwise, append the current character to the current column
          arr[row][col] += cc;
        }

        callback(null, arr);
      }
    };
  }

  /* Vanilla JS method by Todd Motto (toddmotto.com) */

  // forEach method, could be shipped as part of an Object Literal/Module

  function forEach(array, callback, scope) {
    for (var i = 0; i < array.length; ++i) {
      callback.call(scope, i, array[i]); // pass back stuff we need
    }
  }

  // class handler

  function hasClass(elem, className) {
    return new RegExp(' ' + className + ' ').test(' ' + elem.className + ' ');
  }

  function addClass(elem, className) {
    if (!hasClass(elem, className)) elem.className += ' ' + className;
  }

  function removeClass(elem, className) {
    var newClass = ' ' + elem.className.replace(/[\t\r\n]/g, ' ') + ' ';
    if (hasClass(elem, className)) {
      while (newClass.indexOf(' ' + className + ' ') >= 0) {
        newClass = newClass.replace(' ' + className + ' ', ' ');
      }
      elem.className = newClass.replace(/^\s+|\s+$/g, '');
    }
  }

  /* HTML Escape */

  function htmlEscape(str) {
    return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
  }

  function htmlUnescape(value) {
    return String(value)
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
  }

  function htmlNewline(str) {
    return String(str).replace(/(\r\n|\r|\n)/g, '<br>');
  }
}

// Mozilla, Opera, Webkit
if (document.addEventListener) {
  document.addEventListener("DOMContentLoaded", function() {
    document.removeEventListener("DOMContentLoaded", arguments.callee, false);
    domReady();
  });
}
// If IE event model is used
else if (document.attachEvent) {
  document.attachEvent("onreadystatechange", function() {
    if (document.readyState === "complete") {
      document.detachEvent("onreadystatechange", arguments.callee);
      domReady();
    }
  });
}

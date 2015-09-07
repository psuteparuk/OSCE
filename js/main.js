function domReady() {
  document.body.className += "javascript";

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

    populateHeader(questions.title, questions.code);
    populateInstructions(questions.problem, questions.instructions);
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

  function setupNavigation() {
    var bookmark = window.location.hash;
    if (bookmark && bookmark[0] === '#') {
      var selectedLink = document.querySelector('a[name="' + bookmark.substr(1) + '-link"]');
      switchPage(selectedLink);
    }

    forEach(document.querySelectorAll('nav a'), function(index, link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        switchPage(link);
      });
    });
  }

  function switchPage(elem) {
    forEach(document.querySelectorAll('nav a'), function(index, link) {
      removeClass(link, 'active');
    });
    addClass(elem, 'active');

    forEach(document.querySelectorAll('.page'), function(index, page) {
      addClass(page, 'hidden');
    });
    removeClass(document.querySelector('.page.' + elem.getAttribute('href').substr(1) + '-page'), 'hidden');

    window.location = elem.getAttribute('href');
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

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

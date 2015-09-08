// Constant
var DEFAULT_ANSWERS = ["ปฏิบัติถูกต้อง", "ปฏิบัติไม่สมบูรณ์", "ไม่ปฏิบัติ"];

// Execute when the DOM is ready
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
    generateForm(questions, '.checklist');
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
    document.querySelector('#title').innerHTML = htmlNewline(htmlEscape(title || ""));
    document.querySelector('#code').innerHTML = htmlNewline(htmlEscape(code || ""));
  }

  // Main Instructions
  function populateInstructions(problem, instructions) {
    document.querySelector('#main-problem').innerHTML = htmlNewline(htmlEscape(problem));
    document.querySelector('#main-instructions').innerHTML = htmlNewline(htmlEscape(instructions));
  }

  // Students List
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

  function generateForm(questions, selector) {
    var targetDom = document.querySelector(selector);

    forEach(questions.children, function(index, topic) {
      var container = document.createElement('div');
      container.className = 'container-12 clearfix';
      targetDom.appendChild(container);

      var grid = document.createElement('div');
      grid.className = 'grid-12';
      container.appendChild(grid);

      var topicElem = document.createElement('h4');
      topicElem.className = 'topic-title';
      topicElem.innerHTML = topic.problem ? htmlEscape((index+1)+' '+topic.problem) : "";
      grid.appendChild(topicElem);

      var table = document.createElement('table');
      table.setAttribute('cellspacing', 0);
      grid.appendChild(table);

      generateAnswersGroup(topic, grid, 'div', 'answers-group-wrapper', 'btn-group btn-group-'+(index+1));

      var hr = document.createElement('hr');
      grid.appendChild(hr);

      generateTableContent(topic.children, table, index+1);
    });
  }

  function generateTableContent(children, parentDom, parentNumbering) {
    if (!children) return;

    forEach(children, function(index, child) {
      var rowElem = document.createElement('tr');
      parentDom.appendChild(rowElem);

      var firstColElem = document.createElement('td');
      firstColElem.className = 'numbering-col';
      firstColElem.innerHTML = parentNumbering + '.' + (index+1);
      rowElem.appendChild(firstColElem);

      var secondColElem = document.createElement('td');
      secondColElem.className = 'problem-col';
      secondColElem.innerHTML = htmlNewline(htmlEscape(child.problem));
      rowElem.appendChild(secondColElem);

      generateAnswersGroup(child, rowElem, 'td', 'answers-col answers-group-wrapper', 'btn-group btn-group-'+parentNumbering+'-'+(index+1));

      generateTableContent(children.children, parentDom, parentNumbering+'.'+(index+1));
    });
  }

  function generateAnswersGroup(problemObj, parentDom, answersElemType, elemClassName, groupClassName) {
    if (problemObj.answerType) {
      var answersElem = document.createElement(answersElemType);
      answersElem.className = elemClassName || "";

      var answers = [];
      if (problemObj.answerType === 1) {
        forEach(DEFAULT_ANSWERS, function(index, ans) {
          if (!problemObj.exclude || problemObj.exclude.indexOf(index)) answers.push(ans);
        });
      } else if (problemObj.answerType === 2) {
        answers = problemObj.answers;
      }

      forEach(answers, function(index, ans) {
        var button = document.createElement('input');
        button.setAttribute('type', 'button');
        button.setAttribute('name', groupClassName.split(' ')[0]);
        button.className = groupClassName || "";
        if (index === 0) {
          addClass(button, 'btn-group-first');
          if (problemObj.answerType === 1) addClass(button, 'btn-group-correct');
        }
        if (index === answers.length-1) {
          addClass(button, 'btn-group-last');
          if (problemObj.answerType === 1) addClass(button, 'btn-group-wrong');
        }
        button.value = htmlEscape(ans);
        button.setAttribute('data-val', index);
        answersElem.appendChild(button);
      });

      parentDom.appendChild(answersElem);

      addBtnGroupHandler(groupClassName);
    }
  }

  function addBtnGroupHandler(groupClassName) {
    var group = document.querySelectorAll('.' + groupClassName.split(' ').join('.'));
    forEach(group, function(index, btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        switchGroup(btn, group, 'active', false);
      });
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

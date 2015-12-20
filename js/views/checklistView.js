var ChecklistView = function(questions, students, options) {
  ChecklistView.DEFAULT_ANSWERS = ["ปฏิบัติถูกต้อง", "ปฏิบัติไม่สมบูรณ์", "ไม่ปฏิบัติ"];

  options = options || {};
  this.questions = questions;
  this.students = students;

  this.studentListElem = document.querySelector('.student-selector .selector');
  this.clearElem = document.querySelector('.student-selector .clear-selector');
  this.checklistForm = document.querySelector('.checklist .checklist-form');
  this.actionButtons = document.querySelector('.checklist .action-buttons');

  this.studentChangeEvent = new CustomEvent('student-change');
};

ChecklistView.prototype.render = function() {
  // TODO: Load from server instead
  document.addEventListener('student-change', function(e) {
    queue()
      .defer(parseCSV, 'result/result_' + this.questions.code + '.csv')
      .await(this.extractResultForStudent.bind(this));
  }.bind(this));

  this.autoCompleteStudentList();

  this.clearElem.addEventListener('click', function(e) {
    e.preventDefault();
    this.clearStudent();
  }.bind(this));

  this.generateForm();

  this.setDefaultStudent(this.students.list[0]);
};

ChecklistView.prototype.autoCompleteStudentList = function() {
  new autoComplete({
    selector: '.' + this.studentListElem.getAttribute('class').split(' ').join('.'),
    minChars: 0,
    source: function(term, suggest) {
      term = term.toLowerCase();
      var suggestions = [];
      forEach(this.students.list, function(index, student) {
        if (~(student.id + ' ' + student.name).toLowerCase().indexOf(term))
          suggestions.push(student);
      });
      suggest(suggestions);
    }.bind(this),
    renderItem: function(item, search) {
      search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
      return '<div class="autocomplete-suggestion" data-name="'+item.name+'" data-code="'+item.id+'" data-val="'+search+'"><span>('+item.id.replace(re, "<b>$1</b>")+')</span> <span>'+item.name.replace(re, "<b>$1</b>")+'</span></div>';
    },
    onSelect: function(e, term, item) {
      this.studentListElem.value = item.getAttribute('data-name');
      this.studentListElem.setAttribute('data-code', item.getAttribute('data-code'));
      document.dispatchEvent(this.studentChangeEvent);
    }.bind(this)
  });

  this.studentListElem.addEventListener('input', function(e) {
    addClass(this.checklistForm, 'hidden');
    addClass(this.actionButtons, 'hidden');
  }.bind(this));
};

ChecklistView.prototype.clearStudent = function() {
  this.studentListElem.value = "";
  this.studentListElem.removeAttribute('data-code');
  addClass(this.checklistForm, 'hidden');
  addClass(this.actionButtons, 'hidden');
};

ChecklistView.prototype.setDefaultStudent = function(defaultStudent) {
  this.studentListElem.value = defaultStudent.name;
  this.studentListElem.setAttribute('data-code', defaultStudent.id);
  document.dispatchEvent(this.studentChangeEvent);
};

ChecklistView.prototype.extractResultForStudent = function(error, resultData) {
  if (error) {
    console.log(error);
    return;
  }

  var studentCode = this.studentListElem.getAttribute('data-code');
  if (!studentCode) return; // No data-code in the selector (not a valid student)

  var savedResult = [];
  forEach(resultData, function(index, individualResult) {
    if (individualResult.length > 1 && individualResult[0] === studentCode) {
      savedResult = individualResult.slice(1);
    }
  });

  // There is previously saved data. Switch button group to corresponding data
  if (savedResult.length > 0) {
    var btnGroupList = document.querySelectorAll('.answers-group-wrapper');
    // Loop through each problem
    forEach(btnGroupList, function(groupIndex, btnGroup) {
      var ansCount = 0;
      // Loop through children of the wrapper class, consider only buttons
      forEach(btnGroup.childNodes, function(ansIndex, btn) {
        if (hasClass(btn, 'btn-group')) {
          ansCount++;
          if (ansCount === parseInt(savedResult[groupIndex], 10)) addClass(btn, 'active');
          else removeClass(btn, 'active');
        }
      });
    });
  } else {
    forEach(document.querySelectorAll('.answers-group-wrapper .btn-group'), function(index, btn) {
      removeClass(btn, 'active');
    });
  }

  removeClass(this.checklistForm, 'hidden');
  removeClass(this.actionButtons, 'hidden');
};

ChecklistView.prototype.generateForm = function() {
  forEach(this.questions.children, function(index, topic) {
    var container = document.createElement('div');
    container.className = 'container-12 clearfix';
    this.checklistForm.appendChild(container);

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

    generateAnswersGroup(topic, grid, 'div', 'answers-group-wrapper', 'btn-group btn-group-'+(index+1), 'btn-group-'+(index+1));

    var hr = document.createElement('hr');
    grid.appendChild(hr);

    generateTableContent(topic.children, table, index+1);
  }.bind(this));

  // recursion function to generate form from the question tree structure
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

      generateAnswersGroup(child, rowElem, 'td', 'answers-col answers-group-wrapper', 'btn-group btn-group-'+parentNumbering+'-'+(index+1), 'btn-group-'+parentNumbering+'-'+(index+1));

      generateTableContent(children.children, parentDom, parentNumbering+'.'+(index+1));
    });
  }

  // create the answer group view based on the answer type
  function generateAnswersGroup(question, parentDom, answersElemType, elemClassName, groupClassName, inputName) {
    if (!question.requireAnswer()) return;

    var answersElem = document.createElement(answersElemType);
    answersElem.className = elemClassName || "";

    var answers = [];
    if (question.isDefaultType()) {
      forEach(ChecklistView.DEFAULT_ANSWERS, function(index, ans) {
        if (!question.exclude || question.exclude.indexOf(index)) answers.push(ans);
      });
    } else if (question.isCustomType()) {
      answers = question.answers;
    }

    forEach(answers, function(index, ans) {
      var button = document.createElement('input');
      button.setAttribute('type', 'button');
      button.setAttribute('name', inputName);
      button.className = groupClassName || "";
      if (index === 0) {
        addClass(button, 'btn-group-first');
        if (question.isDefaultType()) addClass(button, 'btn-group-correct');
      }
      if (index === answers.length-1) {
        addClass(button, 'btn-group-last');
        if (question.isDefaultType()) addClass(button, 'btn-group-wrong');
      }
      button.value = htmlEscape(ans);
      button.setAttribute('data-val', index);
      answersElem.appendChild(button);
    });

    parentDom.appendChild(answersElem);

    // add button switch handler
    var group = document.querySelectorAll('.' + groupClassName.split(' ').join('.'));
    forEach(group, function(index, btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        switchGroup(btn, group, 'active', false);
      });
    });
  }
};

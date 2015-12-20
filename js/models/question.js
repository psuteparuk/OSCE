var Question = function(question, options) {
  options = options || {};
  this.problem = question.problem;
  this.answerType = question.answerType;
  this.isLeaf = !question.children || question.length === 0;

  if (!this.requireAnswer()) {
    this.children = [];
    forEach(question.children, function(index, child) {
      this.children.push(new Question(child));
    }.bind(this));
  }
  if (this.isDefaultType()) {
    this.exclude = question.exclude;
  } else if (this.isCustomType()) {
    this.answers = question.answers;
  }
};

Question.prototype.requireAnswer = function() {
  return this.isLeaf;
};

Question.prototype.isDefaultType = function() {
  return this.answerType === 1;
};

Question.prototype.isCustomType = function() {
  return this.answerType === 2;
};

var Questions = function(questions, options) {
  options = options || {};
  this.title = questions.title;
  this.code = questions.code;
  this.problem = questions.problem;
  this.instructions = questions.instructions;
  this.children = [];
  forEach(questions.children, function(index, child) {
    this.children.push(new Question(child));
  }.bind(this));
};

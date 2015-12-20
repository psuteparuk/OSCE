var InstructionsView = function(questions, options) {
  options = options || {};
  this.questions = questions;

  this.titleElem = document.querySelector('#title');
  this.codeElem = document.querySelector('#code');
  this.mainProblemElem = document.querySelector('#main-problem');
  this.mainInstructionsElem = document.querySelector('#main-instructions');
};

InstructionsView.prototype.render = function() {
  this.setTitle(this.questions.title);
  this.setCode(this.questions.code);
  this.setMainProblem(this.questions.problem);
  this.setMainInstructions(this.questions.instructions);
};

// Header

InstructionsView.prototype.setTitle = function(title) {
  this.titleElem.innerHTML = htmlNewline(htmlEscape(title || ""));
};

InstructionsView.prototype.setCode = function(code) {
  this.codeElem.innerHTML = htmlNewline(htmlEscape(code || ""));
};

// Main Instructions

InstructionsView.prototype.setMainProblem = function(problem) {
  this.mainProblemElem.innerHTML = htmlNewline(htmlEscape(problem));
};

InstructionsView.prototype.setMainInstructions = function(instructions) {
  this.mainInstructionsElem.innerHTML = htmlNewline(htmlEscape(instructions));
};

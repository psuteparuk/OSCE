var Student = function(student, options) {
  options = options || {};
  this.id = student[0];
  this.name = student[1];
};

var Students = function(students, options) {
  options = options || {};
  this.list = [];
  forEach(students, function(index, student) {
    this.list.push(new Student(student));
  }.bind(this));
};

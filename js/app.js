var App = function(questionsFilePath, studentsFilePath, options) {
  options = options || {};
  this.questionsFilePath = questionsFilePath;
  this.studentsFilePath = studentsFilePath;
};

// Execute when DOM is ready
App.prototype.init = function() {
  document.body.className += "javascript";
  this.setupNavigation();

  queue()
    .defer(parseJSON, this.questionsFilePath)
    .defer(parseCSV, this.studentsFilePath)
    .await(function (error, questionsJSON, studentsCSV) {
      if (error) {
        console.log(error);
        return;
      }

      this.questions = new Questions(questionsJSON);
      this.students = new Students(studentsCSV);

      // Instruction page
      this.instructionsView = new InstructionsView(this.questions);
      this.instructionsView.render();

      // Checklist page
      this.checklistView = new ChecklistView(this.questions, this.students);
      this.checklistView.render();
    }.bind(this));
};

App.prototype.setupNavigation = function() {
  var navGroup = document.querySelectorAll('nav a');
  var pageGroup = document.querySelectorAll('.page');

  forEach(navGroup, function(index, link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var correspondingPage = document.querySelector('.page.' + link.getAttribute('href').substr(2) + '-page');
      switchGroup(link, navGroup, 'active', false);
      switchGroup(correspondingPage, pageGroup, 'hidden', true);
      window.location = link.getAttribute('href');
    });
  });

  forEach(['instructions', 'equipments', 'checklist'], function(index, page) {
    Path.map('#/' + page).to(function() {
      var selectedLink = document.querySelector('a[name="' + page + '-link"]');
      var selectedPage = document.querySelector('.page.' + page + '-page');
      switchGroup(selectedLink, navGroup, 'active', false);
      switchGroup(selectedPage, pageGroup, 'hidden', true);
    });
  });

  Path.listen();
};

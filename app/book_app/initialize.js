$(function() {

  // The main app
  var BookApp = require('./bookapp');

  // load up all the modules
  var LibraryApp = require('./bookapp.library_app');
  var LibraryRouting = require('./bookapp.library_app.routing');
  var BookList = require('./bookapp.library_app.book_list');
  var Closer = require('./bookapp.closer');

  BookApp.start();

});

$(function() {

  var BookApp = require('./bookapp');
  var LibraryApp = require('./bookapp.library_app')(BookApp);
  var LibraryRouting = require('./bookapp.library_app.routing')(BookApp);
  var BookList = require('./bookapp.library_app.book_list')(BookApp);
  var Closer = require('./bookapp.closer')(BookApp);

  BookApp.LibraryApp = LibraryApp;
  BookApp.LibraryApp.BookList = BookList;
  BookApp.LibraryRouting = LibraryRouting;
  BookApp.Closer = Closer;

  BookApp.start();
});

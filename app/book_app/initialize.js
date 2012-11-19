$(function() {

  var BookApp = require('./bookapp');
  var LibraryApp = require('./bookapp.library_app')(BookApp);
  var BookList = require('./bookapp.library_app.book_list')(BookApp);

  BookApp.LibraryApp = LibraryApp;
  BookApp.LibraryApp.BookList = BookList;

  BookApp.addInitializer(function(){
    BookApp.LibraryApp.initializeLayout();
//    BookApp.LibraryApp.Books.search("c++");
     BookApp.vent.trigger('search:term', "food");
  });

  BookApp.start();
});

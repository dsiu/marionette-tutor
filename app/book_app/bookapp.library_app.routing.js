/**
 * Created with IntelliJ IDEA.
 * User: dsiu
 * Date: 11/19/12
 * Time: 4:46 PM
 * To change this template use File | Settings | File Templates.
 */

var BookApp = require('./bookapp');

BookApp.module('LibraryRouting', function (LibraryRouting, BookApp, Backbone, Marionette, $, _) {

  LibraryRouting.Router = Backbone.Marionette.AppRouter.extend(
    {
      appRoutes : {
        ""                   : "defaultSearch",
        "search/:searchTerm" : "search"
      }
    });

  BookApp.vent.on('search:term', function (searchTerm) {
    Backbone.history.navigate('search/' + searchTerm);
  });

  BookApp.addInitializer(function () {
    LibraryRouting.router = new LibraryRouting.Router(
      {
        controller : BookApp.LibraryApp
      });

    BookApp.vent.trigger("routing:started");
  });

  return LibraryRouting;
});

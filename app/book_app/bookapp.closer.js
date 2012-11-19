/**
 * Created with IntelliJ IDEA.
 * User: dsiu
 * Date: 11/19/12
 * Time: 5:20 PM
 * To change this template use File | Settings | File Templates.
 */

var closeTemplate = require('./views/templates/close-template');


var Closer = function(BookApp) {

  var Closer = {};

  Closer.DefaultView = Backbone.Marionette.ItemView.extend(
    {
      template  : closeTemplate,
      className : 'close'
    });

  Closer.Router = Backbone.Marionette.AppRouter.extend(
    {
      appRoutes : {
        'close' : 'close'
      }
    });

  Closer.close = function () {
    var closeView = new Closer.DefaultView();
    BookApp.content.show(closeView);
    Backbone.history.navigate('close');
  };

  BookApp.addInitializer(function () {
    BookApp.Closer.router = new Closer.Router(
      {
        controller : BookApp.Closer
      });

    BookApp.vent.trigger('routing:started');
  });

  return Closer;
};

module.exports = Closer;
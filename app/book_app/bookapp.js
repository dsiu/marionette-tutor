var BookApp = new Backbone.Marionette.Application();

// see http://lostechies.com/derickbailey/2012/04/17/managing-a-modal-dialog-with-backbone-and-marionette/
var ModalRegion = Backbone.Marionette.Region.extend({
  el: "#modal",

  constructor: function () {
    _.bindAll(this);
    Backbone.Marionette.Region.prototype.constructor.apply(this, arguments);
    this.on("show", this.showModal, this);
  },

  getEl: function (selector) {
    var $el = $(selector);
    $el.on("hidden", this.close);
    return $el;
  },

  showModal: function (view) {
    view.on("close", this.hideModal, this);
    this.$el.modal('show');
  },

  hideModal: function () {
    this.$el.modal('hide');
  }
});

BookApp.addRegions(
  {
    content : '#content',
    menu : "#menu",
    modal : ModalRegion
  });

BookApp.MenuView = Backbone.Marionette.View.extend(
  {
    el : '#menu',

    events : {
      'click #menu .js-menu-books' : 'showLibraryApp',
      'click #menu .js-menu-close' : 'closeApp'
    },

    showLibraryApp : function(e) {
      e.preventDefault();
      BookApp.LibraryApp.defaultSearch();
    },

    closeApp : function(e) {
      e.preventDefault();
    }
  });

BookApp.vent.on('layout:rendered', function() {
  //  console.log('layout rendered');
  var menu = new BookApp.MenuView();
  BookApp.menu.attachView(menu);
});

BookApp.vent.on('routing:started', function() {
  if ( ! Backbone.History.started )
    Backbone.history.start();
});

module.exports = BookApp;

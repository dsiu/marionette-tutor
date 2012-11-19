var BookApp = new Backbone.Marionette.Application();

// see http://lostechies.com/derickbailey/2012/04/17/managing-a-modal-dialog-with-backbone-and-marionette/
var ModalRegion = Backbone.Marionette.Region.extend({
  el: "#modal",

  constructor: function () {
    console.log('modal constructor');
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
    modal : ModalRegion
  });

BookApp.vent.on('layout:rendered', function() {
  console.log('layout rendered');
});

module.exports = BookApp;

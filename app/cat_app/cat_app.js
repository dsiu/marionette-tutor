// Application bootstrapper.

var app = new Backbone.Marionette.Application();

app.addRegions({ mainRegion: "#content"});

app.addInitializer(function(options) {
  var AngryCatsView = require('./views/angrycats_view');

  var angryCatsView = new AngryCatsView({collection: options.cats});
  console.log('app init');

	app.mainRegion.show(angryCatsView);
});

module.exports = app;

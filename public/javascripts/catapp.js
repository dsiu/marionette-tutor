(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    definition(module.exports, localRequire(name), module);
    var exports = cache[name] = module.exports;
    return exports;
  };

  var require = function(name) {
    var path = expand(name, '.');

    if (has(cache, path)) return cache[path];
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex];
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '"');
  };

  var define = function(bundle) {
    for (var key in bundle) {
      if (has(bundle, key)) {
        modules[key] = bundle[key];
      }
    }
  }

  globals.require = require;
  globals.require.define = define;
  globals.require.brunch = true;
})();

window.require.define({"cat_app/cat_app": function(exports, require, module) {
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
  
}});

window.require.define({"cat_app/initialize_cat_app": function(exports, require, module) {
  var catApp = require('./cat_app');
  var AngryCats = require('./models/angrycats');
  var AngryCat = require('./models/angrycat');

  $(function() {
    var cats = new AngryCats(
      [
        new AngryCat({ name: 'Wet Cat', image_path : 'images/cat2.jpg' }) ,
        new AngryCat({ name : 'Bitey Cat', image_path : 'images/cat1.jpg' }),
        new AngryCat({ name : 'Surprised Cat', image_path : 'images/cat3.jpg' })
      ]);
    console.log('before app start');
    catApp.start({cats : cats});

    cats.add(new AngryCat({ name: 'Cranky Cat', image_path: 'images/cat4.jpg',
                          rank: cats.size() + 1 }));
  });

  
}});

window.require.define({"cat_app/models/angrycat": function(exports, require, module) {
  var BaseModel;

  BaseModel = require('models/model');

  module.exports = BaseModel.extend({
    defaults: {
      rank: 0,
      votes: 0
    },
    rankUp: function() {
      return this.set({
        rank: (this.get('rank')) - 1
      });
    },
    rankDown: function() {
      return this.set({
        rank: (this.get('rank')) + 1
      });
    },
    addVote: function() {
      return this.set({
        votes: (this.get('votes')) + 1
      });
    }
  });
  
}});

window.require.define({"cat_app/models/angrycats": function(exports, require, module) {
  var AngryCat, BaseCollection, catApp;

  catApp = require('../cat_app');

  BaseCollection = require('models/collection');

  AngryCat = require('./angrycat');

  module.exports = BaseCollection.extend({
    'model': AngryCat,
    'initialize': function(cats) {
      var rank, self;
      rank = 1;
      self = this;
      _.each(cats, function(cat) {
        cat.set('rank', rank++);
        catApp.vent.on('rank:up', function(cat) {
          console.log('cats rank up');
          if (cat.get('rank' === 1)) {
            return;
          }
          self.rankUp(cat);
          return self.sort();
        });
        catApp.vent.on('rank:down', function(cat) {
          console.log('cats rank down');
          if (cat.get === self.size) {
            return;
          }
          self.rankDown(cat);
          self.sort();
          return 2;
        });
        return catApp.vent.on('cat:disqualify', function(cat) {
          var c, catsToUprank, disqualifiedRank, _i, _len;
          disqualifiedRank = cat.get('rank');
          catsToUprank = self.filter(function(cat) {
            return cat.get('rank' > disqualifiedRank);
          });
          for (_i = 0, _len = catsToUprank.length; _i < _len; _i++) {
            c = catsToUprank[_i];
            c.rankUp();
          }
          return self.trigger('reset');
        });
      });
      this.on('add', function(cat) {
        var error;
        if (!cat.get('rank')) {
          error = Error("Cat must have a rank defined before being added to the collection");
          error.name = "NoRankError";
          throw error;
        }
      });
    },
    comparator: function(cat) {
      return cat.get('rank');
    },
    rankUp: function(cat) {
      var otherCat, rankToSwap;
      rankToSwap = (cat.get('rank')) - 1;
      otherCat = this.at(rankToSwap - 1);
      cat.rankUp();
      return otherCat.rankDown();
    },
    rankDown: function(cat) {
      var otherCat, rankToSwap;
      rankToSwap = (cat.get('rank')) + 1;
      otherCat = this.at(rankToSwap - 1);
      cat.rankDown();
      return otherCat.rankUp();
    }
  });
  
}});

window.require.define({"cat_app/views/angrycat_view": function(exports, require, module) {
  var catApp, template;

  catApp = require('../cat_app');

  template = require('./templates/angry_cat-template');

  module.exports = Backbone.Marionette.ItemView.extend({
    'template': template,
    'tagName': 'tr',
    'className': 'angry_cat',
    'events': {
      'click .rank_up img': 'rankUp',
      'click .rank_down img': 'rankDown',
      'click a.disqualify': 'disqualify'
    },
    'rankUp': function() {
      this.model.addVote();
      return catApp.vent.trigger("rank:up", this.model);
    },
    'rankDown': function() {
      this.model.addVote();
      return catApp.vent.trigger("rank:down", this.model);
    },
    'disqualify': function() {
      catApp.vent.trigger("cat:disqualify", this.model);
      return this.model.destroy();
    },
    'initialize': function() {
      return this.bindTo(this.model, "change:votes", this.render);
    }
  });
  
}});

window.require.define({"cat_app/views/angrycats_view": function(exports, require, module) {
  var AngryCatView, template;

  AngryCatView = require('./angrycat_view');

  template = require('./templates/angry_cats-template');

  module.exports = Backbone.Marionette.CompositeView.extend({
    tagName: "table",
    id: "angry_cats",
    className: "table-striped table-bordered",
    template: template,
    itemView: AngryCatView,
    appendHtml: function(collectionView, itemView) {
      return collectionView.$("tbody").append(itemView.el);
    }
  });
  
}});


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

window.require.define({"book_app/bookapp": function(exports, require, module) {
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
      modal : ModalRegion
    });

  BookApp.vent.on('layout:rendered', function() {
    //  console.log('layout rendered');
  });

  BookApp.vent.on('routing:started', function() {
    if ( ! Backbone.History.started )
      Backbone.history.start();
  });

  module.exports = BookApp;
  
}});

window.require.define({"book_app/bookapp.library_app.book_list": function(exports, require, module) {
  var bookTemplate = require('./views/templates/book-template');
  var bookListTemplate = require('./views/templates/book-list-template');
  var bookDetailTemplate = require('./views/templates/book-detail-template');

  var BookList = function(BookApp) {

    var BookList = {};

    var BookDetailView = Backbone.Marionette.ItemView.extend(
      {
        template : bookDetailTemplate,
        className : "modal bookDetail"
      });

    var BookView = Backbone.Marionette.ItemView.extend(
      {
        template : bookTemplate,

        events : {
          'click' : 'showBookDetail'
        },

        showBookDetail : function() {
          var detailView = new BookDetailView({model : this.model});
          BookApp.modal.show(detailView);
        }
      });

    var BookListView = Backbone.Marionette.CompositeView.extend(
      {
        template : bookListTemplate,
        id       : "bookList",
        itemView : BookView,

        initialize : function() {
          _.bindAll(this, 'showMessage', 'loadMoreBooks');
          var self = this;
          BookApp.vent.on('search:error', function () { self.showMessage('Error, please retry later :s') });
          BookApp.vent.on('search:noSearchTerm', function () { self.showMessage('Hummmm, can do better :)') });
          BookApp.vent.on('search:noSearchResult', function () { self.showMessage('No books found') });
        },

        events : {
          'scroll' : 'loadMoreBooks'
        },


        appendHtml : function (collectionView, itemView) {
          collectionView.$(".books").append(itemView.el);
        },

        showMessage : function(message) {
          this.$('.books').html('<h1 class="notFound">' + message + '</h1>');
        },

        loadMoreBooks : function() {
          var totalHeight = this.$('> div').height(),
            scrollTop = this.$el.scrollTop() + this.$el.height(),
            margin = 200;

          // if we are closer than 'margin' to the end of the content, load more books
          if (scrollTop + margin >= totalHeight) {
            BookApp.vent.trigger("search:more");
          }
        }

      });

    var SearchView = Backbone.View.extend(
      {
        el: "#searchBar",

        initialize: function() {
          var self = this;
          var $spinner = self.$('#spinner');
          BookApp.vent.on("search:start", function() { $spinner.fadeIn(); });
          BookApp.vent.on("search:stop", function() { $spinner.fadeOut(); });
          BookApp.vent.on('search:term', function(term) {
            self.$('#searchTerm').val(term);
          })
        },

        events: {
          'change #searchTerm' : 'search'
        },

        search: function() {
          var searchTerm = this.$('#searchTerm').val().trim();
          if (searchTerm.length > 0) {
            BookApp.vent.trigger('search:term', searchTerm);
          } else {
            BookApp.vent.trigger('search:noSearchTerm');
          }
        }
      });

    BookList.showBooks = function (books) {
      var bookListView = new BookListView({ collection : books });
      BookApp.LibraryApp.layout.books.show(bookListView);
    };


    // events hook up
    BookApp.vent.on("layout:rendered", function () {
      BookApp.LibraryApp.BookList.showBooks(BookApp.LibraryApp.Books);
       // render a view for the existing HTML in the template, and attach it to the layout (i.e. don't double render)
      var searchView = new SearchView();
      BookApp.LibraryApp.layout.search.attachView(searchView);
    });
    return BookList;
  };

  module.exports = BookList;

  
}});

window.require.define({"book_app/bookapp.library_app": function(exports, require, module) {
  var layout = require('./views/layouts/library-layout');

  var LibraryApp = function (BookApp) {

    var LibraryApp = {};

    var Layout = Backbone.Marionette.Layout.extend(
      {
        template : layout,

        regions : {
          search : "#searchBar",
          books  : "#bookContainer"
        }
      });


    // Book Model
    var Book = Backbone.Model.extend();

    // Books Collection
    var Books = Backbone.Collection.extend(
      {
        model : Book,

        initialize : function () {
          var self = this;

          _.bindAll(this, 'search', 'moreBooks');
          BookApp.vent.on('search:term', function (term) {
            console.log('search:term = ' + term);
            self.search(term);
          });

          BookApp.vent.on('search:more', function () {
            console.log('need to load more books!');
            self.moreBooks();
          });

          // the number of books we fetch each time
          this.maxResults = 40;
          // the results "page" we last fetched
          this.page = 0;

          // flags whether the collection is currently in the process of fetching
          // more results from the API (to avoid multiple simultaneous calls
          this.loading = false;

          // remember the previous search
          this.previousSearch = null;

          // the maximum number of results for the previous search
          this.totalItems = null;
        },

        search : function (searchTerm) {
          this.page = 0;

          var self = this;
          this.fetchBooks(searchTerm, function (books) {
            if (books.length < 1) {
              BookApp.vent.trigger('search:noResults');
            }
            else {
              self.reset(books);
            }
          });
          this.previousSearch = searchTerm;
        },

        moreBooks : function () {
          // if we've loaded all the books for this search, there are no more to load !
          if (this.length >= this.totalItems) { return true; }

          var self = this;
          this.fetchBooks(this.previousSearch, function(books) { self.add(books); });
        },

        fetchBooks : function (searchTerm, callback) {
          if (this.loading) return true;

          this.loading = true;

          var self = this;
          BookApp.vent.trigger("search:start");
          console.log('search:start');
          var query = encodeURIComponent(searchTerm) + '&maxResults=' + this.maxResults + '&startIndex=' + (this.page * this.maxResults) + '&fields=totalItems,items(id,volumeInfo/title,volumeInfo/subtitle,volumeInfo/authors,volumeInfo/publishedDate,volumeInfo/description,volumeInfo/imageLinks)';

          return $.ajax({
                   url      : 'https://www.googleapis.com/books/v1/volumes',
                   dataType : 'jsonp',
                   data     : 'q=' + query,
                   success  : function (res) {
                     BookApp.vent.trigger("search:stop");
                     console.log('search:stop');

                     if (res.totalItems == 0) {
                       callback([]);
                       return [];
                     }
                     if (res.items) {
                       self.page++;
                       self.totalItems = res.totalItems;
                       var searchResults = [];
                       _.each(res.items, function (item) {
                         var thumbnail = null;
                         if (item.volumeInfo && item.volumeInfo.imageLinks && item.volumeInfo.imageLinks.thumbnail) {
                           thumbnail = item.volumeInfo.imageLinks.thumbnail;
                         }
                         searchResults[searchResults.length] = new Book({
                                                                          thumbnail   : thumbnail,
                                                                          title       : item.volumeInfo.title,
                                                                          subtitle    : item.volumeInfo.subtitle,
                                                                          description : item.volumeInfo.description,
                                                                          googleId    : item.id
                                                                        });
                       });
                       callback(searchResults);
                       self.loading = false;
                       return searchResults;
                     }
                     else if (res.error) {
                       BookApp.vent.trigger("search:error");
                       self.loading = false;
                     }
                   }
                 });
        }
      });

    // Init Books Collection
    LibraryApp.Books = new Books();

    LibraryApp.search = function(term) {
      LibraryApp.initializeLayout();
      BookApp.LibraryApp.BookList.showBooks(LibraryApp.Books);
      BookApp.vent.trigger('search:term', term);
    };

    LibraryApp.defaultSearch = function() {
      LibraryApp.search('Neuromarketing');
    };


    // Init New Layout
    LibraryApp.initializeLayout = function () {
      LibraryApp.layout = new Layout();

      LibraryApp.layout.on("show", function () {
        BookApp.vent.trigger("layout:rendered");
      });

      BookApp.content.show(BookApp.LibraryApp.layout);
    };

    // return
    return LibraryApp;

  };

  module.exports = LibraryApp;
  
}});

window.require.define({"book_app/bookapp.library_app.routing": function(exports, require, module) {
  /**
   * Created with IntelliJ IDEA.
   * User: dsiu
   * Date: 11/19/12
   * Time: 4:46 PM
   * To change this template use File | Settings | File Templates.
   */


  var LibraryRouting = function (BookApp) {
    var LibraryRouting = {};

    LibraryRouting.Router = Backbone.Marionette.AppRouter.extend(
      {
        appRoutes : {
          ""                   : "defaultSearch",
          "search/:searchTerm" : "search"
        }
      });

    BookApp.vent.on('search:term', function (searchTerm) {
      console.log('diu diu diu');
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
  };

  module.exports = LibraryRouting;
  
}});

window.require.define({"book_app/initialize": function(exports, require, module) {
  $(function() {

    var BookApp = require('./bookapp');
    var LibraryApp = require('./bookapp.library_app')(BookApp);
    var LibraryRouting = require('./bookapp.library_app.routing')(BookApp);
    var BookList = require('./bookapp.library_app.book_list')(BookApp);

    BookApp.LibraryApp = LibraryApp;
    BookApp.LibraryApp.BookList = BookList;
    BookApp.LibraryRouting = LibraryRouting;

    BookApp.start();
  });
  
}});

window.require.define({"book_app/views/layouts/library-layout": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "<div id=\"searchBar\">\n    Search : <input type=\"text\" name=\"search\" autocomplete=\"off\" id=\"searchTerm\" value=\"\" />\n    <img src=\"images/loader.gif\" alt=\"Loading...\" id=\"spinner\" />\n</div>\n\n<div id=\"bookContainer\"></div>";});
}});

window.require.define({"book_app/views/templates/book-detail-template": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;

  function program1(depth0,data) {
    
    var buffer = "", stack1;
    buffer += "\n                  ";
    foundHelper = helpers.thumbnail;
    stack1 = foundHelper || depth0.thumbnail;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "thumbnail", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\n                ";
    return buffer;}

  function program3(depth0,data) {
    
    
    return "\n                  http://placehold.it/100x150\n                ";}

  function program5(depth0,data) {
    
    var buffer = "", stack1;
    buffer += " <h2>";
    foundHelper = helpers.subtitle;
    stack1 = foundHelper || depth0.subtitle;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "subtitle", { hash: {} }); }
    buffer += escapeExpression(stack1) + "</h2> ";
    return buffer;}

  function program7(depth0,data) {
    
    var buffer = "", stack1;
    buffer += " ";
    foundHelper = helpers.description;
    stack1 = foundHelper || depth0.description;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "description", { hash: {} }); }
    buffer += escapeExpression(stack1) + " ";
    return buffer;}

  function program9(depth0,data) {
    
    
    return "No description found";}

    buffer += "<a class=\"close\" data-dismiss=\"modal\">x</a>\n    <div class=\"imgBook\">\n      <img src=\"";
    foundHelper = helpers.thumbnail;
    stack1 = foundHelper || depth0.thumbnail;
    stack2 = helpers['if'];
    tmp1 = self.program(1, program1, data);
    tmp1.hash = {};
    tmp1.fn = tmp1;
    tmp1.inverse = self.program(3, program3, data);
    stack1 = stack2.call(depth0, stack1, tmp1);
    if(stack1 || stack1 === 0) { buffer += stack1; }
    buffer += "\"\n       />\n    </div>\n    <h1>";
    foundHelper = helpers.title;
    stack1 = foundHelper || depth0.title;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "title", { hash: {} }); }
    buffer += escapeExpression(stack1) + "</h1>\n\n     ";
    foundHelper = helpers.subtitle;
    stack1 = foundHelper || depth0.subtitle;
    stack2 = helpers['if'];
    tmp1 = self.program(5, program5, data);
    tmp1.hash = {};
    tmp1.fn = tmp1;
    tmp1.inverse = self.noop;
    stack1 = stack2.call(depth0, stack1, tmp1);
    if(stack1 || stack1 === 0) { buffer += stack1; }
    buffer += "\n     ";
    foundHelper = helpers.description;
    stack1 = foundHelper || depth0.description;
    stack2 = helpers['if'];
    tmp1 = self.program(7, program7, data);
    tmp1.hash = {};
    tmp1.fn = tmp1;
    tmp1.inverse = self.program(9, program9, data);
    stack1 = stack2.call(depth0, stack1, tmp1);
    if(stack1 || stack1 === 0) { buffer += stack1; }
    buffer += "\n\n    <b>Google link :</b> <a href=\"http://books.google.fr/books?id=";
    foundHelper = helpers.googleId;
    stack1 = foundHelper || depth0.googleId;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "googleId", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\" target=\"_blank\">http://books.google.fr/books?id=";
    foundHelper = helpers.googleId;
    stack1 = foundHelper || depth0.googleId;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "googleId", { hash: {} }); }
    buffer += escapeExpression(stack1) + "</a>\n";
    return buffer;});
}});

window.require.define({"book_app/views/templates/book-list-template": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "<div style=\"display:table;width:100%;height:100%;\">\n    <img src=\"images/shadow-search.png\" style=\"position:absolute;left: 0px;top: 0px;\"/>\n    <img src=\"images/shadow-search-right.png\" style=\"position:absolute;right: 0px;top: 0px;\"/>\n    <div class=\"leftBar\"></div>\n    <div class=\"books\"></div>\n    <div class=\"rightBar\"></div>\n</div>";});
}});

window.require.define({"book_app/views/templates/book-template": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var buffer = "", stack1, stack2, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;

  function program1(depth0,data) {
    
    var buffer = "", stack1;
    buffer += "\n            ";
    foundHelper = helpers.thumbnail;
    stack1 = foundHelper || depth0.thumbnail;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "thumbnail", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\n          ";
    return buffer;}

  function program3(depth0,data) {
    
    
    return "\n            http://placehold.it/100x150\n          ";}

    buffer += "<img src=\"";
    foundHelper = helpers.thumbnail;
    stack1 = foundHelper || depth0.thumbnail;
    stack2 = helpers['if'];
    tmp1 = self.program(1, program1, data);
    tmp1.hash = {};
    tmp1.fn = tmp1;
    tmp1.inverse = self.program(3, program3, data);
    stack1 = stack2.call(depth0, stack1, tmp1);
    if(stack1 || stack1 === 0) { buffer += stack1; }
    buffer += "\"\n     alt=\"\" class=\"book\" />";
    return buffer;});
}});

window.require.define({"cat_app/views/templates/angry_cat-template": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var buffer = "", stack1, foundHelper, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;


    buffer += "<td>";
    foundHelper = helpers.rank;
    stack1 = foundHelper || depth0.rank;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "rank", { hash: {} }); }
    buffer += escapeExpression(stack1) + "</td>\n<td>";
    foundHelper = helpers.name;
    stack1 = foundHelper || depth0.name;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
    buffer += escapeExpression(stack1) + "</td>\n<td><img class=\"angry_cat_pic\" src=\"";
    foundHelper = helpers.image_path;
    stack1 = foundHelper || depth0.image_path;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "image_path", { hash: {} }); }
    buffer += escapeExpression(stack1) + "\" alt=\"\"></td>\n<td>\n    <div class=\"rank_up\"><img class=\"rank_up\" src=\"images/up.gif\" alt=\"\"></div>\n    <div class=\"rank_down\"><img class=\"rank_down\" src=\"images/down.gif\" alt=\"\"></div>\n</td>\n<td>";
    foundHelper = helpers.votes;
    stack1 = foundHelper || depth0.votes;
    if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
    else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "votes", { hash: {} }); }
    buffer += escapeExpression(stack1) + "</td>\n<td><a href=\"#\" class='disqualify'>Disqualify</a></td>\n";
    return buffer;});
}});

window.require.define({"cat_app/views/templates/angry_cats-template": function(exports, require, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
    helpers = helpers || Handlebars.helpers;
    var foundHelper, self=this;


    return "<thead>\n<tr class='header'>\n    <th>Rank</th>\n    <th>Name</th>\n    <th>Image</th>\n    <th>Votes</th>\n    <th></th>\n</tr>\n</thead>\n<tbody>\n</tbody>\n";});
}});

window.require.define({"lib/router": function(exports, require, module) {
  var application = require('application');

  module.exports = Backbone.Router.extend({
    routes: {
      '': 'home'
    },

    home: function() {
      $('body').html(application.homeView.render().el);
    }
  });
  
}});

window.require.define({"lib/view_helper": function(exports, require, module) {
  // Put your handlebars.js helpers here.
  
}});

window.require.define({"models/collection": function(exports, require, module) {
  // Base class for all collections.
  module.exports = Backbone.Collection.extend({
    
  });
  
}});

window.require.define({"models/model": function(exports, require, module) {
  // Base class for all models.
  module.exports = Backbone.Model.extend({
    
  });
  
}});


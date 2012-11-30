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

window.require.define({"book_app/bookapp.closer": function(exports, require, module) {
  /**
   * Created with IntelliJ IDEA.
   * User: dsiu
   * Date: 11/19/12
   * Time: 5:20 PM
   * To change this template use File | Settings | File Templates.
   */

  var closeTemplate = require('./views/templates/close-template');
  var BookApp = require('./bookapp');

  BookApp.module('Closer', function(Closer, BookApp, Backbone, Marionette, $, _) {

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
  });
  
}});

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
    var menu = new BookApp.MenuView();
    BookApp.menu.attachView(menu);
  });

  BookApp.vent.on('routing:started', function() {
    if ( ! Backbone.History.started )
      Backbone.history.start();
  });

  module.exports = BookApp;
  
}});

window.require.define({"book_app/bookapp.library_app.book_list": function(exports, require, module) {
  var BookApp = require('./bookapp');
  var bookTemplate = require('./views/templates/book-template');
  var bookListTemplate = require('./views/templates/book-list-template');
  var bookDetailTemplate = require('./views/templates/book-detail-template');

  BookApp.module('LibraryApp.BookList', function(BookList, BookApp, Backbone, Marionette, $, _) {

    // BookDetailView Class
    var BookDetailView = Backbone.Marionette.ItemView.extend(
      {
        template : bookDetailTemplate,
        className : "modal bookDetail"
      });

    // BookView Class
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

    // BookListC Class
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

    // SearchView Class
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
  });


  
}});

window.require.define({"book_app/bookapp.library_app": function(exports, require, module) {
  var library_layout = require('./views/layouts/library-layout');
  var BookApp = require('./bookapp');

  BookApp.module('LibraryApp', function(LibraryApp, BookApp, Backbone, Marionette, $, _) {

    // LibraryApp Layout Class
    var Layout = Backbone.Marionette.Layout.extend(
      {
        template : library_layout,

        regions : {
          search : "#searchBar",
          books  : "#bookContainer"
        }
      });

    // Book Model Class
    var Book = Backbone.Model.extend();

    // Books Collection Class
    var Books = Backbone.Collection.extend(
      {
        model : Book,

        initialize : function () {
          var self = this;

          _.bindAll(this, 'search', 'moreBooks');
          BookApp.vent.on('search:term', function (term) {
            self.search(term);
          });

          BookApp.vent.on('search:more', function () {
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
          var query = encodeURIComponent(searchTerm) + '&maxResults=' + this.maxResults + '&startIndex=' + (this.page * this.maxResults) + '&fields=totalItems,items(id,volumeInfo/title,volumeInfo/subtitle,volumeInfo/authors,volumeInfo/publishedDate,volumeInfo/description,volumeInfo/imageLinks)';

          return $.ajax({
                   url      : 'https://www.googleapis.com/books/v1/volumes',
                   dataType : 'jsonp',
                   data     : 'q=' + query,
                   success  : function (res) {
                     BookApp.vent.trigger("search:stop");

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

  });

  // module.exports = LibraryApp;
  
}});

window.require.define({"book_app/bookapp.library_app.routing": function(exports, require, module) {
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
  
}});

window.require.define({"book_app/initialize": function(exports, require, module) {
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
  
}});


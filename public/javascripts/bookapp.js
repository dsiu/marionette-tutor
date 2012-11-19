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
          console.log('showBookDetail');
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
          console.log(searchTerm);
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

window.require.define({"book_app/initialize": function(exports, require, module) {
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
  
}});

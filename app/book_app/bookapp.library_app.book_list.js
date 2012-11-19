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


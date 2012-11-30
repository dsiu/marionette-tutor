exports.config =
  # Edit the next line to change default build path.
  paths:
    public: 'public'

  files:
    javascripts:
      # Defines what file will be generated with `brunch generate`.
      defaultExtension: 'js'
      # Describes how files will be compiled & joined together.
      # Available formats:
      # * 'outputFilePath'
      # * map of ('outputFilePath': /regExp that matches input path/)
      # * map of ('outputFilePath': function that takes input path)
      joinTo:
        'javascripts/catapp.js': /^app(\/|\\)(?=cat_app)/
        'javascripts/bookapp.js': /^app(\/|\\)(?=book_app)/
        'javascripts/app.js': /^(?!(cat_app|book_app))/
        'javascripts/vendor.js': /^vendor/
      # Defines compilation order.
      # `vendor` files will be compiled before other ones
      # even if they are not present here.
      order:
        before: [
          'vendor/scripts/console-helper.js',
          'vendor/scripts/jquery-1.8.2.js',
          'vendor/scripts/underscore-1.4.2.js',
          'vendor/scripts/backbone-0.9.2.js',
          'vendor/scripts/backbone-mediator.js',

          # backbone.marionette
          'vendor/scripts/backbone.marionette.js',

          # Twitter Bootstrap jquery plugins
          'vendor/scripts/bootstrap/bootstrap-transition.js',
          'vendor/scripts/bootstrap/bootstrap-alert.js',
          'vendor/scripts/bootstrap/bootstrap-button.js',
          'vendor/scripts/bootstrap/bootstrap-carousel.js',
          'vendor/scripts/bootstrap/bootstrap-collapse.js',
          'vendor/scripts/bootstrap/bootstrap-dropdown.js',
          'vendor/scripts/bootstrap/bootstrap-modal.js',
          'vendor/scripts/bootstrap/bootstrap-tooltip.js',
          'vendor/scripts/bootstrap/bootstrap-popover.js',
          'vendor/scripts/bootstrap/bootstrap-scrollspy.js',
          'vendor/scripts/bootstrap/bootstrap-tab.js',
          'vendor/scripts/bootstrap/bootstrap-typeahed.js'
        ]

    stylesheets:
      defaultExtension: 'less'
      joinTo:
        'stylesheets/catapp.css': /^app(\/|\\)(?=cat_app)/
        'stylesheets/bookapp.css': /^app(\/|\\)(?=book_app)/
        'stylesheets/app.css': /^(?!(cat_app|book_app))/
      order:
       before: [ 'vendor/styles/bootstrap/bootstrap.less' ]

    templates:
      defaultExtension: 'hbs'
      joinTo:
        'javascripts/catapp.js': /^app(\/|\\)(?=cat_app)/
        'javascripts/bookapp.js': /^app(\/|\\)(?=book_app)/
        'javascripts/app.js': /^(?!(cat_app|book_app))/

  # Change this if you're using something other than backbone (e.g. 'ember').
  # Content of files, generated with `brunch generate` depends on the setting.
  # framework: 'backbone'

  # Settings of web server that will run with `brunch watch [--server]`.
  # server:
  #   # Path to your server node.js module.
  #   # If it's commented-out, brunch will use built-in express.js server.
  #   path: 'server.coffee'
  #   port: 3333
  #   # Run even without `--server` option?
  #   run: yes

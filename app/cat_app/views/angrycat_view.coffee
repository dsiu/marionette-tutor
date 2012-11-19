catApp = require '../cat_app'
template = require './templates/angry_cat-template'

module.exports = Backbone.Marionette.ItemView.extend
  'template': template

  'tagName': 'tr'

  'className': 'angry_cat'

  'events':
    'click .rank_up img': 'rankUp'
    'click .rank_down img': 'rankDown'
    'click a.disqualify': 'disqualify'

  'rankUp': ->
    @model.addVote()
    catApp.vent.trigger "rank:up", @model

  'rankDown': ->
    @model.addVote()
    catApp.vent.trigger "rank:down", @model

  'disqualify': ->
    catApp.vent.trigger "cat:disqualify", @model
    @model.destroy()

  'initialize': ->
    @bindTo @model, "change:votes", @render


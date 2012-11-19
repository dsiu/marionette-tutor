AngryCatView = require './angrycat_view'
template = require './templates/angry_cats-template'

module.exports = Backbone.Marionette.CompositeView.extend

	tagName: "table"

	id: "angry_cats"

	className: "table-striped table-bordered"

	template: template

	itemView: AngryCatView

	appendHtml: (collectionView, itemView) ->
    collectionView.$("tbody").append(itemView.el)

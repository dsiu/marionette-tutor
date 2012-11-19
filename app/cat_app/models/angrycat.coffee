BaseModel = require 'models/model'

module.exports = BaseModel.extend
	defaults:
		rank : 0
		votes : 0

	rankUp: ->
		@set
			rank:
				(@get 'rank') - 1

	rankDown: ->
		@set
			rank:
				(@get 'rank') + 1

	addVote: ->
		@set
			votes:
				(@get 'votes') + 1

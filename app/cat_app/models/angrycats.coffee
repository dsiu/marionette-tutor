catApp = require '../cat_app'
BaseCollection = require 'models/collection'
AngryCat = require './angrycat'

module.exports = BaseCollection.extend
  'model': AngryCat

  'initialize': (cats) ->
    rank = 1;
    self = @

    _.each cats, (cat) ->
      cat.set 'rank', rank++

      catApp.vent.on 'rank:up', (cat) ->
        console.log 'cats rank up'
        return if cat.get 'rank' is 1

        self.rankUp cat
        self.sort()

      catApp.vent.on 'rank:down', (cat) ->
        console.log 'cats rank down'
        return if cat.get is self.size
        self.rankDown cat
        self.sort()
        return 2

      catApp.vent.on 'cat:disqualify', (cat) ->
        disqualifiedRank = cat.get 'rank'
        catsToUprank = self.filter (cat) -> cat.get 'rank' > disqualifiedRank
        c.rankUp() for c in catsToUprank
        self.trigger 'reset'


    @on 'add', (cat) ->
      if not cat.get 'rank'
        error = Error "Cat must have a rank defined before being added to the collection"
        error.name = "NoRankError"
        throw error

    return



  comparator: (cat) ->
    cat.get 'rank'

  rankUp: (cat) ->
    rankToSwap = (cat.get 'rank') - 1
    otherCat = @at (rankToSwap - 1)

    cat.rankUp()
    otherCat.rankDown()

  rankDown: (cat) ->
    rankToSwap = (cat.get 'rank') + 1
    otherCat = @at (rankToSwap - 1)

    cat.rankDown()
    otherCat.rankUp()



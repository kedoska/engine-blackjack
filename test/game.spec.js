/*!
 * engine-blackjack
 * Copyright(c) 2016 Marco Casula
 * GPL 2.0 Licensed
 */

const assert = require('assert')
const Game = require('../src/game')
const actions = require('../src/actions')
const util = require('util')

const print = (obj) => {
  console.log(util.inspect(
    Object.assign(obj, { deck: null })
    , false, null))
}

describe('Game flow', function () {
  describe('# Basic game activity', function () {
    it('should restore() deal() and stand()', function () {
      const game = new Game()
      print(game.dispatch(actions.restore()))
      print(game.dispatch(actions.deal()))
      print(game.dispatch(actions.stand('right')))

    })
    it('should restore() deal() split() hit() and stand() for both sides', function () {
      const game = new Game()
      print(game.dispatch(actions.restore()))
      print(game.dispatch(actions.deal()))
      print(game.dispatch(actions.split()))
      print(game.dispatch(actions.hit('right')))
      print(game.dispatch(actions.stand('right')))
      print(game.dispatch(actions.hit('left')))
      print(game.dispatch(actions.stand('left')))
    })
  })
})

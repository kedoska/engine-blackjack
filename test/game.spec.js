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

describe('Game actions', function () {
  describe('# restore()', function () {
    it('should get return the status of the current game', function () {
      const game = new Game()
      print(game.dispatch(actions.restore()))
      print(game.dispatch(actions.deal()))
      print(game.dispatch(actions.split()))
      print(game.dispatch(actions.hit('right')))
      print(game.dispatch(actions.hit('right')))
      print(game.dispatch(actions.hit('right')))
      print(game.dispatch(actions.hit('right')))
      print(game.dispatch(actions.hit('right')))
    })
  })
})

/*!
 engine-blackjack
 Copyright (C) 2016 Marco Casula

 This program is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 2 of the License.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along
 with this program; if not, write to the Free Software Foundation, Inc.,
 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

const assert = require('assert')
const Game = require('../src/game')
const actions = require('../src/actions')
const util = require('util')

const print = (obj) => {
  return 0
  console.log(util.inspect(
    Object.assign(obj, { deck: null })
    , false, null))
}

describe('Game flow', function () {
  describe('# Basic game activity', function () {
    it('should restore() deal() and stand()', function () {
      const game = new Game()
      print(game.dispatch(actions.restore()))
      print(game.dispatch(actions.deal({})))
      print(game.dispatch(actions.stand({ position: 'right' })))

    })
    it('should restore() deal() split() hit() and stand() for both sides', function () {
      const game = new Game()
      print(game.dispatch(actions.restore()))
      print(game.dispatch(actions.deal({})))
      print(game.dispatch(actions.split()))
      print(game.dispatch(actions.hit({ position: 'right' })))
      print(game.dispatch(actions.stand({ position: 'right' })))
      print(game.dispatch(actions.hit({ position: 'left' })))
      print(game.dispatch(actions.stand({ position: 'left' })))
    })
  })
})

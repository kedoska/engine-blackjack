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
const presets = require('../src/presets')
const actions = require('../src/actions')
const engine = require('../src/engine')


const executeFlow = (rules = {} , cards, activity) => {
  const game = new Game(null, presets.getRules(rules))
  let status = game.getState()
  status.deck = status.deck.concat(engine.serializeCards(cards))
  activity.forEach(fn => {
    // this is simulating the re-initialization done by an hypothetical server
    const instance = new Game(status)
    status = instance.dispatch(fn())
  })
  return status
}

const functions = {
  'restore': () => actions.restore(),
  'deal': () => actions.deal({bet: 10}),
  'split': () => actions.split(),
  'hitR': () => actions.hit({position: 'right'}),
  'standR': () => actions.stand({position: 'right'}),
  'standL': () => actions.stand({position: 'left'})
}

describe('Game flow', function () {
  describe('# Finish the game', function () {
    [
      {
        cards: '♠10 ♦1 ♥5 ♣6 ♠11 ♦10',
        actions: ['restore', 'deal', 'split', 'standR'],
        stage: 'done',
        finalWin: 0
      },
      {
        cards: '♠2 ♦1 ♥5 ♣6 ♠11 ♦10',
        actions: ['restore', 'deal', 'split', 'hitR', 'hitR', 'hitR'],
        stage: 'done',
        finalWin: 0
      },
      {
        cards: '♥3 ♣3 ♠2 ♦2',
        actions: ['restore', 'deal', 'split', 'standR'],
        stage: 'player-turn-left',
        finalWin: 0
      },
      {
        // force showdown after splitting ace rule ON.
        // in this case we want to terminate the game even if right side has 20
        cards: '♥9 ♦K ♥3 ♣3 ♠1 ♦1',
        actions: ['restore', 'deal', 'split'],
        stage: 'done',
        finalWin: 0,
        rules: {
          showdownAfterAceSplit: true
        }
      },
      {
        // force showdown after splitting ace rule OFF.
        // in this case the game is not closed on left
        cards: '♥9 ♦K ♥3 ♣3 ♠1 ♦1',
        actions: ['restore', 'deal', 'split'],
        stage: 'player-turn-right',
        finalWin: 0,
        rules: {
          showdownAfterAceSplit: false
        }
      }
    ].forEach(test => {
      it(`should deal ${test.cards} execute ${test.actions.join('-')} and finish`, function () {
        const state = executeFlow(test.rules, test.cards, test.actions.map(x => functions[x]))
        if (test.stage) {
          assert.equal(state.stage, test.stage, test.cards)
        }
        if (test.finalWin) {
          assert.equal(state.finalWin, test.finalWin)
        }
      })
    })
  })
})

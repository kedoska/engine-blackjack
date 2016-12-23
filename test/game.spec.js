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
  'standL': () => actions.stand({position: 'left'}),
  'insuranceInjectAmount': () => actions.insurance({bet: 100}),
  'insuranceYes': () => actions.insurance({bet: 1}),
  'insuranceNo': () => actions.insurance({bet: 0})
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
  describe('# insurance dealer BJ', function() {
    const test = {
      cards: '♦10 ♥1 ♦3 ♦3',
    }
    it(`INSURANCE ON: should deal ${test.cards} and wait for "insurance" YES or NO`, function () {
      const actions = ['restore', 'deal']
      const rules = {insurance: true}
      const state = executeFlow(rules, test.cards, actions.map(x => functions[x]))
      const { handInfo: { right: { availableActions } } } = state
      assert.equal(state.stage, 'player-turn-right', 'blackjack but insurance is ON and first card is ♥1')
      assert.equal(state.dealerHasBlackjack, false, 'blackjack is still a secret here')
      assert.equal(availableActions.insurance, true, 'can insure')
      assert.equal(availableActions.double, false, 'double should not be allowed')
      assert.equal(availableActions.split, false, 'split should not be allowed')
      assert.equal(availableActions.hit, false, 'hit should not be allowed')
      assert.equal(availableActions.surrender, false, 'surrender should not be allowed')
      assert.equal(availableActions.stand, false, 'stand should not be allowed')
    })
    it(`INSURANCE ON: should deal ${test.cards}, insure YES, and finish`, function () {
      const actions = ['restore', 'deal', 'insuranceYes']
      const rules = {insurance: true}
      const state = executeFlow(rules, test.cards, actions.map(x => functions[x]))
      const { finalBet, wonOnRight, handInfo: { right } } = state
      assert.equal(state.stage, 'done', 'blackjack but insurance is ON and first card is ♥1')
      assert.equal(right.playerInsuranceValue, 1, 'insurance risk should be 1')
      assert.equal(finalBet, 11, 'bet 10 and insurance 1')
      assert.equal(right.close, true, 'right hand should be close')
      assert.equal(wonOnRight, 2, 'insurance pays 2 to 1 when dealer has bj')
    })
    it(`INSURANCE ON: prevent amount injection`, function () {
      const actions = ['restore', 'deal', 'insuranceInjectAmount']
      const rules = {insurance: true}
      const state = executeFlow(rules, test.cards, actions.map(x => functions[x]))
      const bet = 10
      const maxInsuranceAmount = bet / 2
      const { finalBet, wonOnRight, handInfo: { right } } = state
      assert.equal(state.stage, 'done', 'blackjack but insurance is ON and first card is ♥1')
      assert.equal(right.playerInsuranceValue, maxInsuranceAmount, 'insurance risk should be 1')
      assert.equal(finalBet, bet + (maxInsuranceAmount), `bet ${bet} and max insurance ${maxInsuranceAmount}`)
      assert.equal(right.close, true, 'right hand should be close')
      assert.equal(wonOnRight, 5 * 2, 'insurance pays 2 to 1 when dealer has bj')
    })
    it(`INSURANCE OFF: should deal ${test.cards} and finish`, function () {
      const actions = ['restore', 'deal']
      const rules = {insurance: false}
      const state = executeFlow(rules, test.cards, actions.map(x => functions[x]))
      assert.equal(state.dealerHasBlackjack, true, 'blackjack is not a secret here')
      assert.equal(state.stage, 'done', test.cards)
    })
  })
  describe('# insurance dealer no BJ', function() {
    it(`INSURANCE ON: should deal '♦5 ♥1 ♦2 ♦2' and wait for "insurance" YES or NO`, function () {
      const actions = ['restore', 'deal']
      const rules = {insurance: true}
      const state = executeFlow(rules, '♦5 ♥1 ♦2 ♦2', actions.map(x => functions[x]))
      const { handInfo: { right: { availableActions } } } = state
      assert.equal(state.stage, 'player-turn-right', 'blackjack but insurance is ON and first card is ♥1')
      assert.equal(availableActions.insurance, true, 'can insure')
      assert.equal(availableActions.double, false, 'double should not be allowed')
      assert.equal(availableActions.split, false, 'split should not be allowed')
      assert.equal(availableActions.hit, false, 'hit should not be allowed')
      assert.equal(availableActions.surrender, false, 'surrender should not be allowed')
      assert.equal(availableActions.stand, false, 'stand should not be allowed')
    })
    it(`INSURANCE ON: should deal '♦5 ♥1 ♦2 ♦2', insurance YES, and stand`, function () {
      const actions = ['restore', 'deal', 'insuranceYes', 'standR']
      const rules = {insurance: true}
      const bet = 10
      const state = executeFlow(rules, '♦5 ♥1 ♦2 ♦2', actions.map(x => functions[x]))
      const { finalBet, wonOnRight, handInfo: { right }, dealerHasBusted } = state
      assert.equal(state.stage, 'done', 'no blackjack, first card is ♥1, should go on')
      assert.equal(right.playerInsuranceValue, 1, 'insurance risk should be 1')
      assert.equal(finalBet, 11, 'bet 10 and insurance 1')
      assert.equal(right.close, true, 'right hand should be close')
      assert.equal(wonOnRight, dealerHasBusted ? bet * 2 : 0, 'insurance pays 0 when dealer has no bj')
    })
    it(`INSURANCE ON: prevent amount injection`, function () {
      const actions = ['restore', 'deal', 'insuranceInjectAmount', 'standR']
      const rules = {insurance: true}
      const state = executeFlow(rules, '♦5 ♥1 ♦2 ♦2', actions.map(x => functions[x]))
      const bet = 10
      const maxInsuranceAmount = bet / 2
      const { finalBet, wonOnRight, handInfo: { right }, dealerHasBusted } = state
      assert.equal(state.stage, 'done', 'blackjack but insurance is ON and first card is ♥1')
      assert.equal(right.playerInsuranceValue, maxInsuranceAmount, 'insurance risk should be 1')
      assert.equal(right.playerValue.hi, 4, 'player value must be 4')
      assert.equal(finalBet, bet + (maxInsuranceAmount), `bet ${bet} and max insurance ${maxInsuranceAmount}`)
      assert.equal(right.close, true, 'right hand should be close')
      assert.equal(wonOnRight, dealerHasBusted ? bet * 2 : 0, 'insurance pays 0 when dealer has no bj')
    })
    it(`INSURANCE OFF: should deal ${'♦5 ♥1 ♦2 ♦2'} and finish`, function () {
      const actions = ['restore', 'deal']
      const rules = {insurance: false}
      const state = executeFlow(rules, '♦5 ♥1 ♦2 ♦2', actions.map(x => functions[x]))
      assert.equal(state.stage, 'player-turn-right', '♦5 ♥1 ♦2 ♦2')
    })
  })
  it('split on 10, have bj on left and bust on right', function () {
    const cards = '♠6 ♦1 ♥5 ♣6 ♠11 ♦10'
    const actions = ['restore', 'deal', 'split', 'hitR', 'hitR', 'hitR']
    const rules = {
      decks: 1,
      standOnSoft17: true,
      double: 'any',
      split: true,
      doubleAfterSplit: true,
      surrender: true,
      insurance: true,
      showdownAfterAceSplit: true
    }
    const state = executeFlow(rules, cards, actions.map(x => functions[x]))
    const { stage, handInfo: { left, right} } = state
    assert.equal(stage, 'done', cards)
    assert.equal(left.close, true, 'L is close')
    assert.equal(left.playerHasBlackjack, true, 'L has BJ')
    assert.equal(right.playerHasBusted, true, 'R has busted')
  })
})

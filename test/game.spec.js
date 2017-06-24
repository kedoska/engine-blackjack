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
import { serializeCards } from '52-deck'
import * as engine from '../src/engine'
import { getRules } from '../src/presets'
import * as actions from '../src/actions'
import Game from '../src/game'

const executeFlow = (rules = {} , cards, activity) => {
  const game = new Game(null, getRules(rules))
  let status = game.getState()
  status.deck = status.deck.concat(serializeCards(cards))
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
  'deal20': () => actions.deal({bet: 20}),
  'deal-luckyLucky': () => actions.deal({bet: 10, sideBets: { luckyLucky: 10 }}),
  'split': () => actions.split(),
  'hitR': () => actions.hit({position: 'right'}),
  'hitL': () => actions.hit({position: 'left'}),
  'standR': () => actions.stand({position: 'right'}),
  'standL': () => actions.stand({position: 'left'}),
  'doubleR': () => actions.double({position: 'right'}),
  'doubleL': () => actions.double({position: 'left'}),
  'insuranceInjectAmount': () => actions.insurance({bet: 100}),
  'insuranceYes': () => actions.insurance({bet: 1}),
  'insurance5': () => actions.insurance({bet: 5}),
  'insuranceNo': () => actions.insurance({bet: 0})
}

const mapToActions = (actions) => actions.map(x => functions[x])

describe('Action validations', function () {
  describe('#deal', function () {
    it('should have a default bet value', function () {
      const game = new Game()
      game.dispatch(actions.deal())
    })
  })
})
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
        cards: '♣6 ♣6 ♣6 ♥3 ♣3 ♠2 ♦2',
        actions: ['restore', 'deal', 'split', 'standR', 'doubleL'],
        stage: 'done',
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
          assert.equal(state.stage, test.stage, `${test.cards} exit stage is ${state.stage} instead of ${test.stage}`)
        }
        if (test.finalWin) {
          assert.equal(state.finalWin, test.finalWin)
        }
      })
    })
    it('should finish the game when player hits 21 (soft)', function () {
      const cards = '♠6 ♠5 ♥10 ♦10 ♦1 ♦9'
      const actions = [ 'restore', 'deal', 'hitR', 'hitR' ]
      const rules = {
        decks: 1,
        standOnSoft17: true,
        double: 'any',
        split: true,
        doubleAfterSplit: true,
        showdownAfterAceSplit: true
      }
      const state = executeFlow(rules, cards, actions.map(x => functions[ x ]))
      const { stage, wonOnRight, handInfo: { right } } = state
      assert.equal(right.playerValue.hi, 21, 'Player has 21 on right')
      assert.equal(stage, 'done', 'game is over')
      assert.equal(wonOnRight, 10 * 2, 'Won')
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
    it('should pay insurance and summary should appears in props "sideBetsInfo"', () => {
      const actions = ['restore', 'deal', 'insurance5']
      const rules = {insurance: true}
      const state = executeFlow(rules, '♦10 ♥1 ♦3 ♦3', actions.map(x => functions[x]))
      const { sideBetsInfo: { insurance : { risk, win }} } = state
      assert.equal(risk, 5, 'insurance risk value is half of 10')
      assert.equal(win, risk * 3, 'insurance win value is 10 + bet = 15')
    })
    it('should not pay insurance and summary should appears in props "sideBetsInfo"', () => {
      const actions = ['restore', 'deal', 'insurance5']
      const rules = {insurance: true}
      const state = executeFlow(rules, '♦3 ♥1 ♦3 ♦3', actions.map(x => functions[x]))
      const { sideBetsInfo: { insurance : { risk, win }} } = state
      assert.equal(risk, 5, 'insurance risk value is 5')
      assert.equal(win, 0, 'insurance win value is 0')
    })
    it(`INSURANCE ON: should deal ${test.cards}, insure YES, and finish`, function () {
      const actions = ['restore', 'deal', 'insuranceYes']
      const rules = {insurance: true}
      const state = executeFlow(rules, test.cards, actions.map(x => functions[x]))
      const { finalBet, wonOnRight, handInfo: { right }, sideBetsInfo: { insurance: { win } } } = state
      assert.equal(state.stage, 'done', 'blackjack but insurance is ON and first card is ♥1')
      assert.equal(finalBet, 15, 'bet 10 and insurance 1')
      assert.equal(right.close, true, 'right hand should be close')
      assert.equal(win, 5 * 3, 'insurance pays 2 to 1 when dealer has bj + insurance value')
      assert.equal(wonOnRight, 0, 'right has no prize')
    })
    it(`INSURANCE ON: should deal ${test.cards}, insure YES, and finish`, function () {
      const actions = ['restore', 'deal20', 'insuranceYes']
      const rules = {insurance: true}
      const state = executeFlow(rules, test.cards, actions.map(x => functions[x]))
      const { finalBet, wonOnRight, handInfo: { right }, sideBetsInfo: { insurance: { risk, win } } } = state
      assert.equal(state.stage, 'done', 'blackjack but insurance is ON and first card is ♥1')
      assert.equal(finalBet, 20 + 10, 'bet 20 and insurance 10')
      assert.equal(right.close, true, 'right hand should be close')
      assert.equal(risk, 10, 'insurance pays 2 to 1 when dealer has bj + insurance value')
      assert.equal(win, 30, 'insurance pays 2 to 1 when dealer has bj + insurance value')
      assert.equal(wonOnRight, 0, 'right has no prize')
    })
    it(`INSURANCE OFF: should deal ${test.cards} and finish`, function () {
      const actions = ['restore', 'deal']
      const rules = {insurance: false}
      const state = executeFlow(rules, test.cards, actions.map(x => functions[x]))
      assert.equal(state.dealerHasBlackjack, true, 'blackjack is not a secret here')
      assert.equal(state.stage, 'done', `${test.cards} stage is ${state.stage} instead of done`)
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
    it(`INSURANCE ON: prevent amount injection`, function () {
      const actions = ['restore', 'deal', 'insuranceInjectAmount', 'standR']
      const rules = {insurance: true}
      const state = executeFlow(rules, '♦5 ♥1 ♦2 ♦2', actions.map(x => functions[x]))
      const bet = 10
      const maxInsuranceAmount = bet / 2
      const { finalBet, wonOnRight, handInfo: { right }, dealerHasBusted } = state
      assert.equal(state.stage, 'done', 'blackjack but insurance is ON and first card is ♥1')
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
    const cards = '♠6 ♠6 ♦1 ♥5 ♣6 ♠11 ♦10'
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
    assert.equal(stage, 'done', `split on 10 ${cards} exit stage is ${stage} instead of done`)
    assert.equal(left.close, true, 'L is close')
    assert.equal(left.playerHasBlackjack, false, 'L has 21')
    assert.equal(right.playerHasBusted, true, 'R has busted')
  })
  it('slits bust on both and dealer showdown', function () {
    const cards = '♠10 ♦10 ♠10 ♦10 ♥2 ♣2 ♠9 ♦9'
    const actions = ['restore', 'deal', 'split', 'hitR', 'hitR', 'hitL', 'hitL']
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
    const { stage, handInfo: { left, right}, dealerCards, finalWin = -1 } = state
    assert.equal(stage, 'done', cards, `state is ${stage}`)
    assert.equal(left.close, true, 'L is close')
    assert.equal(left.close, true, 'L is close')
    assert.equal(right.playerHasBusted, true, 'R has busted')
    assert.equal(left.playerHasBusted, true, 'L has busted')
    assert.equal(dealerCards.length, 2, 'dealer has 2 cards')
    assert.equal(finalWin, 0, 'player lose')
  })
  it('no bj bonus after split', function() {
    const cards = '♠10 ♦10 ♠10 ♦10 ♥2 ♣2 ♠1 ♦1'
    const actions = ['restore', 'deal', 'split']
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
    const { stage, handInfo: { left, right}, dealerHasBusted, wonOnLeft, wonOnRight } = state
    assert.equal(stage, 'done', cards)
    assert.equal(dealerHasBusted, true, 'dealer has busted')
    assert.equal(left.close, true, 'L is close')
    assert.equal(right.close, true, 'R is close')
    assert.equal(right.playerHasBlackjack, false, 'no BJ on right')
    assert.equal(engine.calculate(right.cards).hi, 21, '21 on right')
    assert.equal(left.playerHasBlackjack, false, 'no BJ on left')
    assert.equal(engine.calculate(left.cards).hi, 21, '21 on left')
    assert.equal(wonOnLeft, 20, 'won 20 on left')
    assert.equal(wonOnRight, 20, 'won 20 on right')
  })
})

describe('Must Stand on 17', function () {
  it('stand on 17', function () {
    const cards = '11d 9s 9d 4s 12h 13d 13h 11h'
    const actions = [ 'restore', 'deal', 'split', 'standR', 'doubleL', 'standL' ]
    const rules = {
      decks: 1,
      standOnSoft17: true,
      double: 'any',
      split: true,
      doubleAfterSplit: true,
      showdownAfterAceSplit: true
    }
    const state = executeFlow(rules, cards, actions.map(x => functions[ x ]))
    const { stage, finalBet, wonOnRight, wonOnLeft, dealerValue,
      handInfo: { left, right }
    } = state
    assert.equal(stage, 'done', `${cards}`)
    assert.equal(finalBet, 30, 'Deal 10, Split 10, DoubleR 10')
    assert.equal(wonOnLeft, 0, 'Won 0 Left (busted)')
    assert.equal(dealerValue.hi, 20, 'Dealer must stop at 20')
    assert.equal(right.playerValue.hi, 19, 'Player Right position 19')
    assert.equal(left.playerValue.hi, 23, 'Player Left position 19')
    assert.equal(wonOnRight, 0, 'Won 0 on Right')
  })
})

describe('Side bets', function () {
  describe('Lucky Lucky', function () {
    it('777 suited should pays 200', function () {
      const dealerCards = serializeCards('7s')
      const playerCards = serializeCards('7s 7s')
      const x = engine.getLuckyLuckyMultiplier(playerCards, dealerCards)
      assert.equal(x, 200, 'LL multiplier')
    })
    it('777 NO-suited should pays 50', function () {
      const dealerCards = serializeCards('7h')
      const playerCards = serializeCards('7s 7s')
      const x = engine.getLuckyLuckyMultiplier(playerCards, dealerCards)
      assert.equal(x, 50, 'LL multiplier')
    })
    it('678 suited should pays 100', function () {
      const dealerCards = serializeCards('8s')
      const playerCards = serializeCards('6s 7s')
      const x = engine.getLuckyLuckyMultiplier(playerCards, dealerCards)
      assert.equal(x, 100, 'LL multiplier')
    })
    it('678 NO-suited should pays 30', function () {
      const dealerCards = serializeCards('8s')
      const playerCards = serializeCards('6s 7c')
      const x = engine.getLuckyLuckyMultiplier(playerCards, dealerCards)
      assert.equal(x, 30, 'LL multiplier')
    })
    it('21 suited should pays 10', function () {
      const dealerCards = serializeCards('10h')
      const playerCards = serializeCards('9h 2h')
      const x = engine.getLuckyLuckyMultiplier(playerCards, dealerCards)
      assert.equal(x, 10, 'LL multiplier')
    })
    it('21 NO-suited should pays 3', function () {
      const dealerCards = serializeCards('10c')
      const playerCards = serializeCards('9h 2h')
      const x = engine.getLuckyLuckyMultiplier(playerCards, dealerCards)
      assert.equal(x, 3, 'LL multiplier')
    })
    it('10 1 8 should pay luckyLucky', function () {
      const rules = {}
      const cards = '9h 10h 1c 8s'
      const actions = mapToActions(['restore', 'deal-luckyLucky'])
      const state = executeFlow(rules, cards, actions)
      const { handInfo: { right: { cards : playerCards } }, dealerCards } = state
      const sideBetsInfo = engine.getSideBetsInfo({luckyLucky: true}, {luckyLucky: 10}, playerCards, dealerCards)
      assert.equal(sideBetsInfo.luckyLucky, 20, 'amount is positive (engine)')
      assert.equal(state.availableBets.luckyLucky, false, 'rule is OFF after deal')
      assert.equal(state.sideBetsInfo.luckyLucky, 20, 'amount is positive (game)')
    })
  })
})

describe('Showdown after aces split', () => {
  test('when showdownAfterAceSplit both sides must be closed', () => {
    const actions = ['restore', 'deal', 'split']
    const rules = {
      showdownAfterAceSplit: true
    }
    const bet = 10
    const state = executeFlow(rules, '♥8 ♥8 ♥1 ♦4 ♥10 ♦1 ♦1', actions.map(x => functions[x]))
    const { stage, initialBet, finalBet, dealerHasBusted, dealerValue, handInfo, wonOnLeft, wonOnRight } = state
    const { left, right } = handInfo
    assert.equal(stage, 'done', 'stage is done')
    assert.equal(finalBet, initialBet * 2, 'final bet is twice initial bet')
    assert.equal(dealerHasBusted, true, 'dealer has busted')
    assert.equal(dealerValue.hi, 22, 'dealer value is 22')
    assert.equal(left.playerValue.hi, 12, 'player left high value is 12 = ♦1 + ♥1')
    assert.equal(right.playerValue.hi, 19, 'player right high value is 19 = ♦1 + ♥8')
    assert.equal(left.close, true, 'left hand should be closed')
    assert.equal(right.close, true, 'right hand should be closed')
    assert.equal(wonOnLeft, 20, 'won something on left')
    assert.equal(wonOnRight, 20, 'won something on right')
  })
})

describe('History detail for each action', () => {
  test('hit should have side cards', () => {
    const cards = '♠6 ♠5 ♥10 ♦10 ♦1 ♦9'
    const actions = [ 'restore', 'deal', 'hitR', 'hitR' ]
    const rules = {}
    const state = executeFlow(rules, cards, actions.map(x => functions[ x ]))
    const { history: [ restore, deal, firstHit, secondHit ] } = state
    assert.ok(firstHit.right.length === 3, 'HIT action has 3 cards')
    assert.ok(secondHit.right.length === 4, 'HIT action has 3 cards')
  })
  test('double should have side cards', () => {
    const cards = '♠6 ♠5 ♥10 ♦10 ♦1 ♦9'
    const actions = [ 'restore', 'deal', 'doubleR' ]
    const rules = {}
    const state = executeFlow(rules, cards, actions.map(x => functions[ x ]))
    const { history: [ restore, deal, double ] } = state
    assert.ok(deal.right.length === 2, '2 cards on right after deal')
    assert.ok(double.right.length === 3, '3 cards on right after double')
  })
})

describe('No matter how many aces ... soft hands do not busts', () => {
  it('should not bust when "lo" is still under 22', () => {
    const cards = '♥5 ♣1 ♥4 ♣9 ♠1 ♦5'
    const actions = [ 'restore', 'deal', 'hitR', 'hitR' ]
    const rules = {
      decks: 1,
      standOnSoft17: true,
      double: 'any',
      split: true,
      doubleAfterSplit: true,
      showdownAfterAceSplit: true
    }
    const state = executeFlow(rules, cards, actions.map(x => functions[ x ]))
    const { handInfo: { right }} = state
    const { playerValue: { hi, lo }, playerHasBusted, close } = right
    assert.equal(lo, 12)
    assert.equal(hi, 22)
    assert.equal(playerHasBusted, false, 'Player should be 12 not 22')
    assert.equal(close, false, 'Right should be open at 12')
  })
  it.only('should pay on handValue.lo', () => {
    const cards = '♥8 ♥5 ♣1 ♥4 ♣9 ♠1 ♦5'
    const actions = [ 'restore', 'deal', 'hitR', 'hitR', 'standR' ]
    const rules = {
      decks: 1,
      standOnSoft17: true,
      double: 'any',
      split: true,
      doubleAfterSplit: true,
      showdownAfterAceSplit: true
    }
    const state = executeFlow(rules, cards, actions.map(x => functions[ x ]))
    const { handInfo: { right }, dealerValue, wonOnRight } = state
    const { playerValue: { hi, lo }, playerHasBusted } = right
    assert.equal(lo, 12)
    assert.equal(hi, 22)
    assert.equal(dealerValue.lo, 21, 'dealer has 21 on lo')
    assert.equal(dealerValue.hi, 21, 'dealer has 21 on hi')
    assert.equal(playerHasBusted, false, 'Player should be 12 not 22')
    assert.equal(wonOnRight, 0, 'player lose. dealer has 21, player 12 or 22')
  })
})
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
const TYPES = require('./constants')
const engine = require('./engine')

const getDefaultSideBets = (active = false) => {
  return {
    luckyLucky: active,
    perfectPairs: active,
    royalMatch: active,
    luckyLadies: active,
    inBet: active,
    MatchTheDealer: active
  }
}

const getRules = ({
  decks = 1,
  standOnSoft17 = true,
  double = 'any',
  split = true,
  doubleAfterSplit = true,
  surrender = true,
  insurance = true,
  showdownAfterAceSplit = true
}) => {
  return {
    decks: decks || 1,
    standOnSoft17: standOnSoft17,
    double: double,
    split: split,
    doubleAfterSplit: doubleAfterSplit,
    surrender: surrender,
    insurance: insurance,
    showdownAfterAceSplit: showdownAfterAceSplit
  }
}

const defaultState = (rules) => {
  return {
    hits: 0,
    initialBet: 0,
    finalBet: 0,
    finalWin: 0,
    wonOnRight: 0,
    wonOnLeft: 0,
    stage: TYPES.STAGE_READY,
    deck: engine.shuffle(engine.newDecks(rules.decks)),
    handInfo: {
      left: {},
      right: {}
    },
    history: [],
    availableBets: getDefaultSideBets(true),
    sideBetsInfo: null,
    rules: rules,
    dealerHoleCard: null,
    dealerHasBlackjack: false,
    dealerHasBusted: false
  }
}

module.exports.defaultState = defaultState
module.exports.getRules = getRules
module.exports.getDefaultSideBets = getDefaultSideBets
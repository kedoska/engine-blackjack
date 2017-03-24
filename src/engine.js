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

import luckyLucky from './paytables/luchyLuchy'

import * as TYPES from './constants'

export const isNull = (obj) => obj === null

export const isUndefined = (obj) => obj === undefined

export const isNullOrUndef = (obj) => isUndefined(obj) || isNull(obj)

export const cardName = (number) => {
  if (isNullOrUndef(number)) {
    return null
  }
  switch (number) {
    case 1: {
      return 'A'
    }
    case 11: {
      return 'J'
    }
    case 12: {
      return 'Q'
    }
    case 13: {
      return 'K'
    }
    default: {
      return number.toString()
    }
  }
}

export const suiteName = (suite) => {
  switch (suite.toLowerCase()) {
    case '♥':
    case 'h':
    case 'heart':
    case 'hearts': {
      return 'hearts'
    }
    case '♦':
    case 'd':
    case 'diamond':
    case 'diamonds': {
      return 'diamonds'
    }
    case '♣':
    case 'c':
    case 'club':
    case 'clubs': {
      return 'clubs'
    }
    case '♠':
    case 's':
    case 'spade':
    case 'spades': {
      return 'spades'
    }
    default: {
      return null
    }
  }
}

export const suiteColor = (suite) => {
  switch (suite) {
    case 'hearts':
      return 'R'
    case 'diamonds':
      return 'R'
    case 'clubs':
      return 'B'
    case 'spades':
      return 'B'
    default:
      return null
  }
}

export const cardValue = (number) => number < 10 ? number : 10

export const makeCard = (number, suite) => {
  const _suite = suiteName(suite)
  return {
    text: cardName(number),
    suite: _suite,
    value: cardValue(number),
    color: suiteColor(_suite)
  }
}

export const newDecks = (n) => {
  let cards = []
  for (let i = 0; i < n; i++) {
    cards = newDeck().concat(cards)
  }
  return cards
}

export const newDeck = () => {
  return [].concat.apply([],
    [ 'hearts', 'diamonds', 'clubs', 'spades' ]
      .map(suite => {
        return [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ]
          .map(number => makeCard(number, suite))
      })
  )
}

export const getRandom = (v) => Math.floor(Math.random() * v)

export const shuffle = (original) => {
  let array = original.slice(0)
  let currentIndex = array.length
  let temporaryValue
  let randomIndex
  while (currentIndex !== 0) {
    randomIndex = getRandom(currentIndex)
    currentIndex -= 1
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }
  return array
}

export const calculate = (array) => {
  if (array.length === 1) {
    if (isNullOrUndef(array[0])) {
      return null
    }
    const value = array[0].value
    return {
      hi: value === 1 ? 11 : value,
      lo: value === 1 ? 1 : value
    }
  }
  const aces = []
  const value = array.reduce((memo, x) => {
    if (x.value === 1) {
      aces.push(1)
      return memo
    }
    memo += x.value
    return memo
  }, 0)
  return aces.reduce((memo, x) => {
    if ((memo.hi + 11) <= 21) {
      memo.hi += 11
      memo.lo += 1
    } else {
      memo.hi += 1
      memo.lo += 1
    }
    return memo
  }, {
    hi: value,
    lo: value
  })
}

export const isBlackjack = (array) => array.length === 2 && calculate(array).hi === 21

export const isSoftHand = (array) => {
  return array.some(x => x.value === 1) &&
    array
      .reduce((memo, x) => {
        memo += (x.value === 1 && memo < 11) ? 11 : x.value
        return memo
      }, 0) === 17
}

export const isSuited = (array = []) => {
  if (array.length === 0) {
    return false
  }
  const suite = array[0].suite
  return array.every(x => x.suite === suite)
}

export const serializeCard = (value) => {
  const digits = value.match(/\d/g)
  let number = null
  let figure = null
  let suite = null
  if (digits && digits.length > 0) {
    number = Number(digits.join(''))
    suite = value.replace(number, '')
  } else {
    ['j', 'q', 'k'].forEach((x, i) => {
      if (value.indexOf(x) || value.indexOf(x.toUpperCase())) {
        number = 11 + i
        figure = x
        suite = value
          .replace(figure, '')
          .replace(figure.toUpperCase(), '')
      }
    })
  }
  suite = suite.replace('-', '')
  return makeCard(number, suite)
}

export const serializeCards = (value) => {
  if (value === '') {
    throw Error('value should contains a valid raw card/s definition')
  }
  return value.split(' ').map(serializeCard)
}

export const countCards = (array) => {
  const systems = {
    'Hi-Lo': [ -1, 1, 1, 1, 1, 1, 0, 0, 0, -1, -1, -1, -1 ]
  }
  return array.reduce((memo, x) => {
    memo += systems['Hi-Lo'][x.value - 1]
    return memo
  }, 0)
}

export const getHandInfo = (playerCards, dealerCards, hasSplit = false) => {
  const handValue = calculate(playerCards)
  if (!handValue) {
    return null
  }
  const hasBlackjack = isBlackjack(playerCards) && hasSplit === false
  const hasBusted = handValue.hi > 21
  const isClosed = hasBusted || hasBlackjack || handValue.hi === 21
  const canDoubleDown = !isClosed && true
  const canSplit = playerCards.length > 1 && playerCards[ 0 ].value === playerCards[ 1 ].value && !isClosed
  const canInsure = dealerCards[ 0 ].value === 1 && !isClosed
  return {
    cards: playerCards,
    playerValue: handValue,
    playerHasBlackjack: hasBlackjack,
    playerHasBusted: hasBusted,
    playerHasSurrendered: false,
    playerInsuranceValue: 0,
    close: isClosed,
    availableActions: {
      double: canDoubleDown,
      split: canSplit,
      insurance: canInsure,
      hit: !isClosed,
      stand: !isClosed,
      surrender: !isClosed
    }
  }
}

export const getHandInfoAfterDeal = (playerCards, dealerCards, initialBet) => {
  const hand = getHandInfo(playerCards, dealerCards)
  hand.bet = initialBet
  // After deal, even if we got a blackjack the hand cannot be considered closed.
  const availableActions = hand.availableActions
  hand.availableActions = {
    ...availableActions,
    stand: true,
    hit: true,
    surrender: true
  }
  return {
    ...hand,
    close: hand.playerHasBlackjack
  }
}

export const getHandInfoAfterSplit = (playerCards, dealerCards, initialBet) => {
  const hand = getHandInfo(playerCards, dealerCards, true)
  const availableActions = hand.availableActions
  hand.availableActions = {
    ...availableActions,
    split: false,
    double: !hand.close && (playerCards.length === 2),
    insurance: false,
    surrender: false
  }
  hand.bet = initialBet
  return hand
}

export const getHandInfoAfterHit = (playerCards, dealerCards, initialBet, hasSplit) => {
  const hand = getHandInfo(playerCards, dealerCards, hasSplit)
  const availableActions = hand.availableActions
  hand.availableActions = {
    ...availableActions,
    double: (playerCards.length === 2),
    split: false,
    insurance: false,
    surrender: false
  }
  hand.bet = initialBet
  return hand
}

export const getHandInfoAfterDouble = (playerCards, dealerCards, initialBet) => {
  const hand = getHandInfoAfterHit(playerCards, dealerCards)
  const availableActions = hand.availableActions
  hand.availableActions = {
    ...availableActions,
    hit: false,
    stand: false
  }
  hand.bet = initialBet * 2
  return {
    ...hand,
    close: true
  }
}

export const getHandInfoAfterStand = (handInfo) => {
  return {
    ...handInfo,
    close: true,
    availableActions: {
      double: false,
      split: false,
      insurance: false,
      hit: false,
      stand: false,
      surrender: false
    }
  }
}

export const getHandInfoAfterSurrender = (handInfo) => {
  const hand = getHandInfoAfterStand(handInfo)
  return {
    ...hand,
    playerHasSurrendered: true,
    close: true
  }
}

export const getHandInfoAfterInsurance = (playerCards, dealerCards, insuranceValue) => {
  const hand = getHandInfo(playerCards, dealerCards)
  const availableActions = hand.availableActions
  hand.availableActions = {
    ...availableActions,
    stand: true,
    hit: true,
    surrender: true,
    insurance: false
  }
  return {
    ...hand,
    close: hand.playerHasBlackjack,
    playerInsuranceValue: insuranceValue
  }
}

export const isLuckyLucky = (playerCards, dealerCards) => {
  // Player hand and dealer's up card sum to 19, 20, or 21 ("Lucky Lucky")
  const v1 = calculate(playerCards).hi + calculate(dealerCards).hi
  const v2 = calculate(playerCards).lo + calculate(dealerCards).lo
  const v3 = calculate(playerCards).hi + calculate(dealerCards).lo
  const v4 = calculate(playerCards).lo + calculate(dealerCards).hi
  return (v1 >= 19 && v1 <= 21) || (v2 >= 19 && v2 <= 21) || (v3 >= 19 && v3 <= 21) || (v4 >= 19 && v4 <= 21)
}

export const getLuckyLuckyMultiplier = (playerCards, dealerCards) => {
  const cards = [].concat(playerCards, dealerCards)
  const isSameSuite = isSuited(cards)
  const flatCards = cards.map(x => x.value).join('')
  const value = calculate(cards)
  return luckyLucky(flatCards, isSameSuite, value)
}

export const isPerfectPairs = (playerCards) => playerCards[0].value === playerCards[1].value

export const getSideBetsInfo = (availableBets, sideBets, playerCards, dealerCards) => {
  const sideBetsInfo = {
    luckyLucky: 0,
    perfectPairs: 0
  }
  if (availableBets.luckyLucky && sideBets.luckyLucky && isLuckyLucky(playerCards, dealerCards)) {
    const multiplier = getLuckyLuckyMultiplier(playerCards, dealerCards)
    sideBetsInfo.luckyLucky = sideBets.luckyLucky * multiplier
  }
  if (availableBets.perfectPairs && sideBets.perfectPairs && isPerfectPairs(playerCards)) {
    // TODO: impl colored pairs
    // TODO: impl mixed pairs
    sideBetsInfo.perfectPairs = sideBets.perfectPairs * 5
  }
  return sideBetsInfo
}

export const isActionAllowed = (actionName, stage) => {
  if (actionName === TYPES.RESTORE) {
    return true
  }
  switch (stage) {
    case TYPES.STAGE_READY: {
      return [TYPES.RESTORE, TYPES.DEAL].indexOf(actionName) > -1
    }
    case TYPES.STAGE_PLAYER_TURN_RIGHT: {
      return [TYPES.STAND, TYPES.INSURANCE, TYPES.SURRENDER, TYPES.SPLIT, TYPES.HIT, TYPES.DOUBLE].indexOf(actionName) > -1
    }
    case TYPES.STAGE_PLAYER_TURN_LEFT: {
      return [TYPES.STAND, TYPES.HIT, TYPES.DOUBLE].indexOf(actionName) > -1
    }
    case TYPES.SHOWDOWN: {
      return [TYPES.SHOWDOWN, TYPES.STAND].indexOf(actionName) > -1
    }
    case TYPES.STAGE_DEALER_TURN: {
      return [TYPES.DEALER_HIT].indexOf(actionName) > -1
    }
    default: {
      return false
    }
  }
}

export const getPrize = (playerHand, dealerCards) => {
  const {
    close = false,
    playerInsuranceValue = 0,
    playerHasSurrendered = true,
    playerHasBlackjack = false,
    playerHasBusted = true,
    playerValue = {},
    bet = 0
  } = playerHand
  const dealerValue = calculate(dealerCards).hi
  const dealerHasBlackjack = isBlackjack(dealerCards)
  const isFirstCardAce = dealerCards[0].value === 1
  const insurancePrize = (isFirstCardAce && dealerHasBlackjack && playerInsuranceValue > 0) ? playerInsuranceValue * 2 : 0
  if (!close) {
    return 0
  }
  if (playerHasBusted) {
    return insurancePrize
  }
  if (playerHasSurrendered) {
    return bet / 2 + insurancePrize
  }
  if (playerHasBlackjack && !dealerHasBlackjack) {
    return bet + (bet * 1.5) + insurancePrize
  }
  const dealerHasBusted = dealerValue > 21
  if (dealerHasBusted) {
    return (bet + bet) + insurancePrize
  }
  if (playerValue.hi > dealerValue) {
    return (bet + bet) + insurancePrize
  } else if (playerValue.hi === dealerValue) {
    return bet + insurancePrize
  }
  return insurancePrize
}

export const getPrizes = ({ history, handInfo: { left, right }, dealerCards }) => {
  const finalBet = history.reduce((memo, x) => {
    memo += x.value
    return memo
  }, 0)
  const wonOnRight = getPrize(right, dealerCards)
  const wonOnLeft = getPrize(left, dealerCards)
  return {
    finalBet: finalBet,
    wonOnRight: wonOnRight,
    wonOnLeft: wonOnLeft
  }
}

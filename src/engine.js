// @flow
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
import type { SideBets, Card, Hand, HandInfo, HandValue } from './flow-typed'

export const isNull = (obj: ?any): boolean => obj === null

export const isUndefined = (obj: ?any): boolean => obj === undefined

export const isNullOrUndef = (obj: ?any): boolean => isUndefined(obj) || isNull(obj)

export const cardName = (number: number): ?string => {
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

export const suiteName = (suite: string): ?string => {
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

export const suiteColor = (suite: ?string): ?string => {
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

export const cardValue = (number: number): number => number < 10 ? number : 10

export const makeCard = (number: number, suite: string): Card => {
  const _suite = suiteName(suite)
  if (isNullOrUndef(_suite)) {
    throw Error('Unknown suite')
  }
  return {
    text: cardName(number),
    suite: _suite,
    value: cardValue(number),
    color: suiteColor(_suite)
  }
}

export const newDecks = (n: number): Array<Card> => {
  let cards = []
  for (let i = 0; i < n; i++) {
    cards = newDeck().concat(cards)
  }
  return cards
}

export const newDeck = (): Array<Card> => {
  return [].concat.apply([],
    [ 'hearts', 'diamonds', 'clubs', 'spades' ]
      .map(suite => {
        return [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ]
          .map(number => makeCard(number, suite))
      })
  )
}

export const getRandom = (v: number) => Math.floor(Math.random() * v)

export const shuffle = (original: Array<Card>): Array<Card> => {
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

export const calculate = (array: Array<Card>): HandValue => {
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
  return aces.reduce((memo) => {
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

export const isBlackjack = (array: Array<Card>): boolean => array.length === 2 && calculate(array).hi === 21

export const isSoftHand = (array: Array<Card>): boolean => {
  return array.some(x => x.value === 1) &&
    array
      .reduce((memo, x) => {
        memo += (x.value === 1 && memo < 11) ? 11 : x.value
        return memo
      }, 0) === 17
}

export const isSuited = (array: Array<Card> = []): boolean => {
  if (array.length === 0) {
    return false
  }
  const suite = array[0].suite
  return array.every(x => x.suite === suite)
}

export const serializeCard = (value: string): Card => {
  const digits: ?Array<any> = value.match(/\d/g)
  const EMPTY: string = ''
  let number: number = 0
  let figure: string
  let suite: string = EMPTY
  if (digits && digits.length > 0) {
    number = Number(digits.join(''))
    suite = value.replace(number.toString(), '')
  } else {
    ['j', 'q', 'k']
      .forEach((x, i) => {
        if (value.indexOf(x) >= 0 || value.indexOf(x.toUpperCase()) >= 0) {
          number = 11 + i
          figure = x
          suite = value
            .replace(figure, EMPTY)
            .replace(figure.toUpperCase(), EMPTY)
        }
      })
  }
  if (number === 0) {
    throw Error('')
  }
  suite = suite.replace('-', EMPTY)
  return makeCard(number, suite)
}

export const serializeCards = (value:string): Array<Card> => {
  if (value === '') {
    throw Error('value should contains a valid raw card/s definition')
  }
  return value.trim().split(' ').map(serializeCard)
}

export const countCards = (array: Array<Card>) => {
  const systems = {
    'Hi-Lo': [ -1, 1, 1, 1, 1, 1, 0, 0, 0, -1, -1, -1, -1 ]
  }
  return array.reduce((memo, x) => {
    memo += systems['Hi-Lo'][x.value - 1]
    return memo
  }, 0)
}

export const getHandInfo = (playerCards: Array<Card>, dealerCards: Array<Card>, hasSplit:boolean = false): Hand => {
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

export const getHandInfoAfterDeal = (playerCards: Array<Card>, dealerCards: Array<Card>, initialBet: number): Hand => {
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

export const getHandInfoAfterSplit = (playerCards: Array<Card>, dealerCards: Array<Card>, initialBet: number): Hand => {
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

export const getHandInfoAfterHit = (playerCards: Array<Card>, dealerCards: Array<Card>, initialBet: number, hasSplit: boolean): Hand => {
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

export const getHandInfoAfterDouble = (playerCards: Array<Card>, dealerCards: Array<Card>, initialBet: number, hasSplit: boolean): Hand => {
  const hand = getHandInfoAfterHit(playerCards, dealerCards, initialBet, hasSplit)
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

export const getHandInfoAfterStand = (handInfo: Hand): Hand => {
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

export const getHandInfoAfterSurrender = (handInfo: Hand): Hand => {
  const hand = getHandInfoAfterStand(handInfo)
  return {
    ...hand,
    playerHasSurrendered: true,
    close: true
  }
}

export const getHandInfoAfterInsurance = (playerCards: Array<Card>, dealerCards: Array<Card>): Hand => {
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
    close: hand.playerHasBlackjack
  }
}

export const isLuckyLucky = (playerCards: Array<Card>, dealerCards: Array<Card>): boolean => {
  // Player hand and dealer's up card sum to 19, 20, or 21 ("Lucky Lucky")
  const v1 = calculate(playerCards).hi + calculate(dealerCards).hi
  const v2 = calculate(playerCards).lo + calculate(dealerCards).lo
  const v3 = calculate(playerCards).hi + calculate(dealerCards).lo
  const v4 = calculate(playerCards).lo + calculate(dealerCards).hi
  return (v1 >= 19 && v1 <= 21) || (v2 >= 19 && v2 <= 21) || (v3 >= 19 && v3 <= 21) || (v4 >= 19 && v4 <= 21)
}

export const getLuckyLuckyMultiplier = (playerCards: Array<Card>, dealerCards: Array<Card>) => {
  const cards = [].concat(playerCards, dealerCards)
  const isSameSuite = isSuited(cards)
  const flatCards = cards.map(x => x.value).join('')
  const value = calculate(cards)
  return luckyLucky(flatCards, isSameSuite, value)
}

export const isPerfectPairs = (playerCards: Array<Card>): boolean => playerCards[0].value === playerCards[1].value

export const getSideBetsInfo = (availableBets: SideBets, sideBets: SideBets, playerCards: Array<Card>, dealerCards: Array<Card>): any => {
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

export const isActionAllowed = (actionName: string, stage: string): boolean => {
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

export const getPrize = (playerHand: Hand, dealerCards: Array<Card>): number => {
  const {
    close = false,
    playerHasSurrendered = true,
    playerHasBlackjack = false,
    playerHasBusted = true,
    playerValue = {},
    bet = 0
  } = playerHand
  const dealerValue = calculate(dealerCards).hi
  const dealerHasBlackjack = isBlackjack(dealerCards)
  if (!close) {
    return 0
  }
  if (playerHasBusted) {
    return 0
  }
  if (playerHasSurrendered) {
    return bet / 2
  }
  if (playerHasBlackjack && !dealerHasBlackjack) {
    return bet + (bet * 1.5)
  }
  const dealerHasBusted = dealerValue > 21
  if (dealerHasBusted) {
    return (bet + bet)
  }
  if (playerValue.hi > dealerValue) {
    return (bet + bet)
  } else if (playerValue.hi === dealerValue) {
    return bet
  }
  return 0
}

export const getPrizes = ({ history, handInfo: { left, right }, dealerCards }: { history: Array<any>, handInfo: HandInfo, dealerCards: Array<Card>}) => {
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

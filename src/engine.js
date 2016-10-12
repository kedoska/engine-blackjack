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

const cardName = (number) => {
  if (!number) {
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

const suiteName = (suite) => {
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

const cardValue = (number) => number < 10 ? number : 10

const makeCard = (number, suite) => {
  return {
    text: cardName(number),
    suite: suiteName(suite),
    value: cardValue(number)
  }
}

const newDeck = () => {
  return [].concat.apply([],
    [ 'hearts', 'diamonds', 'clubs', 'spades' ]
      .map(suite => {
        return [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ]
          .map(number => makeCard(number, suite))
      })
  )
}

const shuffle = (original) => {
  let array = original.slice(0)
  let currentIndex = array.length, temporaryValue, randomIndex
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }
  return array
}

const calculate = (array) => {
  if (array.length === 1) {
    if (!array[0]) {
      return null
    }
    const value = array[0].value
    return value === 1 ? 11 : value
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
    if ((memo + 11) <= 21) {
      memo += 11
    } else {
      memo += 1
    }
    return memo
  }, value)
}

const isBlackjack = (array) => calculate(array) === 21

const serializeCard = (value) => {
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

const serializeCards = (value) => {
  return value.split(' ').map(serializeCard)
}

const countCards = (array) => {
  const systems = {
    'Hi-Lo': [-1, 1, 1, 1, 1, 1, 0, 0, 0, -1, -1, -1, -1 ]
  }
  return array.reduce((memo, x) => {
    memo += systems['Hi-Lo'][x.value - 1]
    return memo
  }, 0)
}

const getHandInfo = (playerCards, dealerCards) => {
  const handValue = calculate(playerCards)
  if (!handValue) {
    return null
  }
  const hasBlackjack = isBlackjack(playerCards)
  const hasBusted = handValue > 21
  const isClosed = hasBusted || hasBlackjack
  const canDoubleDown = handValue >= 9 && handValue <= 15 && !isClosed
  const canSplit = playerCards.length > 1 && playerCards[ 0 ].value === playerCards[ 1 ].value && !isClosed
  const canEnsure = dealerCards[ 0 ].value === 1 && !isClosed
  return {
    cards: playerCards,
    playerValue: handValue,
    playerHasBlackjack: hasBlackjack,
    playerHasBusted: handValue > 21,
    playerHasSurrendered: false,
    close: isClosed,
    availableActions: {
      double: canDoubleDown,
      split: canSplit,
      insurance: canEnsure,
      hit: !isClosed,
      stand: !isClosed,
      surrender: !isClosed
    }
  }
}

const getHandInfoAfterDeal = (playerCards, dealerCards, initialBet) => {
  const hand = getHandInfo(playerCards, dealerCards)
  hand.bet = initialBet
  // After deal, even if we got a blackjack the hand cannot be considered closed.
  const availableActions = hand.availableActions
  hand.availableActions = Object.assign(availableActions, {
    stand: true,
    hit: true,
    surrender: true
  })
  return Object.assign(hand, {close: false})
}

const getHandInfoAfterSplit = (playerCards, dealerCards, initialBet) => {
  const hand = getHandInfo(playerCards, dealerCards)
  const availableActions = hand.availableActions
  hand.availableActions = Object.assign(availableActions, {
    stand: false,
    split: false,
    insurance: false,
    surrender: false
  })
  return hand
}

const getHandInfoAfterHit = (playerCards, dealerCards) => {
  const hand = getHandInfo(playerCards, dealerCards)
  const availableActions = hand.availableActions
  hand.availableActions = Object.assign(availableActions, {
    double: false,
    split: false,
    insurance: false,
    surrender: false
  })
  return hand
}

const getHandInfoAfterDouble = (playerCards, dealerCards, initialBet) => {
  const hand = getHandInfoAfterHit(playerCards, dealerCards)
  hand.bet = initialBet * 2
  return Object.assign(hand, {close: true})
}

const getHandInfoAfterStand = (handInfo) => {
  return Object.assign(handInfo, {
    close: true,
    availableActions: {
      double: false,
      split: false,
      insurance: false,
      hit: false,
      stand: false,
      surrender: false
    }
  })
}

const getHandInfoAfterSurrender = (handInfo) => {
  const hand = getHandInfoAfterStand(handInfo)
  return Object.assign(hand, {
    playerHasSurrendered: true,
    close: true
  })
}

const isLuckyLucky = (playerCards, dealerCards) => {
  // Player hand and dealer's up card sum to 19, 20, or 21 ("Lucky Lucky")
  const value = calculate(playerCards) + calculate(dealerCards)
  return value >= 19 && value <= 21
}

const isPerfectPairs = (playerCards) => playerCards[0].value === playerCards[1].value

const getSideBetsInfo = (availableBets, sideBets, playerCards, dealerCards) => {
  const sideBetsInfo = {
    luckyLucky: 0,
    perfectPairs: 0
  }
  if (availableBets.luckyLucky && sideBets.luckyLucky && isLuckyLucky(playerCards, dealerCards)) {
    sideBetsInfo.luckyLucky = sideBets.luckyLucky * 2
  }
  if (availableBets.perfectPairs && sideBets.perfectPairs && isPerfectPairs(playerCards)) {
    // TODO: impl colored pairs
    // TODO: impl mixed pairs
    sideBetsInfo.perfectPairs = sideBets.perfectPairs * 5
  }
  return sideBetsInfo
}

/**
 * Verify if the action name is allowed in a specific stage.
 * This method is used during the action dispatch before to consider
 * the real state of the game or more complex game situations.
 * @param actionName any action name available
 * @param stage any stage name
 * @returns {boolean}
 */
const isActionAllowed = (actionName, stage) => {
  if (actionName === 'RESTORE') {
    return true
  }
  switch (stage) {
    case 'ready': {
      return ['RESTORE', 'DEAL'].indexOf(actionName) > -1
    }
    case 'player-turn-right': {
      return ['STAND', 'SURRENDER', 'SPLIT', 'HIT', 'DOUBLE'].indexOf(actionName) > -1
    }
    case 'player-turn-left': {
      return ['STAND', 'HIT', 'DOUBLE'].indexOf(actionName) > -1
    }
    case 'showdown': {
      return ['SHOWDOWN', 'STAND'].indexOf(actionName) > -1
    }
    case 'dealer-turn': {
      return ['DEALER-HIT'].indexOf(actionName) > -1
    }
    default: {
      return false
    }
  }
}

const getPrize = (playerHand, dealerValue) => {
  const { close = false, playerHasSurrendered = true, playerHasBlackjack = false, playerHasBusted = true, playerValue = 0, bet = 0 } = playerHand
  if (close && !playerHasBusted) {
    if (playerHasSurrendered) {
      return bet / 2
    }
    if (playerHasBlackjack) {
      return bet + (bet * 1.5)
    }
    const dealerHasBusted = dealerValue > 21
    if (dealerHasBusted) {
      return (bet + bet)
    }
    if (playerValue > dealerValue) {
      return (bet + bet)
    } else if (playerValue === dealerValue) {
      return bet
    }
  }
  return 0
}

module.exports.newDeck = newDeck
module.exports.shuffle = shuffle
module.exports.calculate = calculate
module.exports.countCards = countCards
module.exports.getHandInfo = getHandInfo
module.exports.getHandInfoAfterDeal = getHandInfoAfterDeal
module.exports.getHandInfoAfterSplit = getHandInfoAfterSplit
module.exports.getHandInfoAfterHit = getHandInfoAfterHit
module.exports.getHandInfoAfterDouble = getHandInfoAfterDouble
module.exports.getHandInfoAfterStand = getHandInfoAfterStand
module.exports.getHandInfoAfterSurrender = getHandInfoAfterSurrender
module.exports.getSideBetsInfo = getSideBetsInfo
module.exports.isBlackjack = isBlackjack
module.exports.serializeCard = serializeCard
module.exports.serializeCards = serializeCards
module.exports.isActionAllowed = isActionAllowed
module.exports.getPrize = getPrize

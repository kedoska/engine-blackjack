/*!
 * engine-blackjack
 * Copyright(c) 2016 Marco Casula
 * GPL 2.0 Licensed
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

const isWinningHand = (player, dealer) => calculate(player) > calculate(dealer)

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
    'Hi-Lo':    [-1, 1, 1, 1, 1, 1, 0, 0, 0, -1, -1, -1, -1 ],
    'Hi-Opt I': [0, 0, 1, 1, 1, 1, 0, 0, 0, -1, -1, -1, -1 ]
  }
  return array.reduce((memo, x) => {
    memo['Hi-Lo'] += systems['Hi-Lo'][x.value - 1]
    memo['Hi-Opt I'] += systems['Hi-Opt I'][x.value - 1]
    return memo
  }, {
    'Hi-Lo': 0,
    'Hi-Opt I': 0
  })
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

const getHandInfoAfterDeal = (playerCards, dealerCards) => {
  return getHandInfo(playerCards, dealerCards)
}

const getHandInfoAfterSplit = (playerCards, dealerCards) => {
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

module.exports.newDeck = newDeck
module.exports.shuffle = shuffle
module.exports.calculate = calculate
module.exports.countCards = countCards
module.exports.getHandInfo = getHandInfo
module.exports.getHandInfoAfterDeal = getHandInfoAfterDeal
module.exports.getHandInfoAfterSplit = getHandInfoAfterSplit
module.exports.getHandInfoAfterHit = getHandInfoAfterHit
module.exports.isBlackjack = isBlackjack
module.exports.serializeCard = serializeCard
module.exports.serializeCards = serializeCards

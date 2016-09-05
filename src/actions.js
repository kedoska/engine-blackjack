/*!
 * engine-blackjack
 * Copyright(c) 2016 Marco Casula
 * GPL 2.0 Licensed
 */

module.exports.restore = () => {
  return {
    type: 'RESTORE'
  }
}

module.exports.deal = () => {
  return {
    type: 'DEAL'
  }
}

module.exports.split = () => {
  return {
    type: 'SPLIT'
  }
}

module.exports.hit = (position = 'right') => {
  return {
    type: 'HIT',
    payload: {
      position: position // left or right
    }
  }
}

module.exports.stand = (position = 'right') => {
  return {
    type: 'STAND',
    payload: {
      position: position // left or right
    }
  }
}

module.exports.showdown = () => {
  return {
    type: 'SHOWDOWN'
  }
}

module.exports.dealerHit = () => {
  return {
    type: 'DEALER-HIT'
  }
}
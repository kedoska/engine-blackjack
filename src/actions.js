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

module.exports.invalid = (action, info) => {
  return {
    type: TYPES.INVALID,
    payload: {
      type: action.type,
      payload: action.payload,
      info: info
    }
  }
}

module.exports.restore = () => {
  return {
    type: TYPES.RESTORE
  }
}

module.exports.deal = ({bet = 10, sideBets = { luckyLucky : 0 }} = {}) => {
  return {
    type: TYPES.DEAL,
    payload: {
      bet: bet,
      sideBets
    }
  }
}

module.exports.insurance = ({bet = 1}) => {
  return {
    type: TYPES.INSURANCE,
    payload: {
      bet: bet
    }
  }
}

module.exports.split = () => {
  return {
    type: TYPES.SPLIT
  }
}

module.exports.hit = ({position = 'right'}) => {
  return {
    type: TYPES.HIT,
    payload: {
      position: position // left or right
    }
  }
}

module.exports.double = ({position = 'right'}) => {
  return {
    type: TYPES.DOUBLE,
    payload: {
      position: position // left or right
    }
  }
}

module.exports.stand = ({position = 'right'}) => {
  return {
    type: TYPES.STAND,
    payload: {
      position: position // left or right
    }
  }
}

module.exports.surrender = () => {
  return {
    type: TYPES.SURRENDER
  }
}

module.exports.showdown = ({dealerHoleCardOnly = false} = {}) => {
  return {
    type: TYPES.SHOWDOWN,
    payload: {
      dealerHoleCardOnly: dealerHoleCardOnly
    }
  }
}

module.exports.dealerHit = ({dealerHoleCard: dealerHoleCard} = {}) => {
  return {
    type: TYPES.DEALER_HIT,
    payload: {
      dealerHoleCard: dealerHoleCard
    }
  }
}

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

module.exports.invalid = (action, info) => {
  return {
    type: 'INVALID',
    payload: {
      type: action.type,
      payload: action.payload,
      info: info
    }
  }
}

module.exports.restore = () => {
  return {
    type: 'RESTORE'
  }
}

module.exports.deal = ({bet = 10}) => {
  return {
    type: 'DEAL',
    payload: {
      bet: bet,
      sideBets: {} // will be matched with availableBets
    }
  }
}

module.exports.insurance = ({bet = 1}) => {
  return {
    type: 'INSURANCE',
    payload: {
      bet: bet
    }
  }
}

module.exports.split = () => {
  return {
    type: 'SPLIT'
  }
}

module.exports.hit = ({position = 'right'}) => {
  return {
    type: 'HIT',
    payload: {
      position: position // left or right
    }
  }
}

module.exports.double = ({position = 'right'}) => {
  return {
    type: 'DOUBLE',
    payload: {
      position: position // left or right
    }
  }
}

module.exports.stand = ({position = 'right'}) => {
  return {
    type: 'STAND',
    payload: {
      position: position // left or right
    }
  }
}

module.exports.surrender = () => {
  return {
    type: 'SURRENDER'
  }
}

module.exports.showdown = () => {
  return {
    type: 'SHOWDOWN'
  }
}

module.exports.dealerHit = ({dealerHoleCard: dealerHoleCard} = {}) => {
  return {
    type: 'DEALER-HIT',
    payload: {
      dealerHoleCard: dealerHoleCard
    }
  }
}

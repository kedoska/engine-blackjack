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

import * as TYPES from './constants'

export const invalid = (action, info) => {
  return {
    type: TYPES.INVALID,
    payload: {
      type: action.type,
      payload: action.payload,
      info: info
    }
  }
}

export const restore = () => {
  return {
    type: TYPES.RESTORE
  }
}

export const deal = ({ bet = 10, sideBets = { luckyLucky: 0 } } = {}) => {
  return {
    type: TYPES.DEAL,
    payload: {
      bet,
      sideBets
    }
  }
}

export const insurance = ({ bet = 1 }) => {
  return {
    type: TYPES.INSURANCE,
    payload: {
      bet
    }
  }
}

export const split = () => {
  return {
    type: TYPES.SPLIT
  }
}

export const hit = ({ position = 'right' }) => {
  return {
    type: TYPES.HIT,
    payload: {
      position
    }
  }
}

export const double = ({ position = 'right' }) => {
  return {
    type: TYPES.DOUBLE,
    payload: {
      position
    }
  }
}

export const stand = ({ position = 'right' }) => {
  return {
    type: TYPES.STAND,
    payload: {
      position
    }
  }
}

export const surrender = () => {
  return {
    type: TYPES.SURRENDER
  }
}

export const showdown = ({ dealerHoleCardOnly = false } = { }) => {
  return {
    type: TYPES.SHOWDOWN,
    payload: {
      dealerHoleCardOnly
    }
  }
}

export const dealerHit = ({ dealerHoleCard } = { }) => {
  return {
    type: TYPES.DEALER_HIT,
    payload: {
      dealerHoleCard
    }
  }
}

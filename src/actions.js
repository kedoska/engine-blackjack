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
import type { Action, Card } from './flow-typed'

export const invalid = (action: Action, info: any): Action => {
  return {
    type: TYPES.INVALID,
    payload: {
      type: action.type,
      payload: action.payload,
      info: info
    }
  }
}

export const restore = (): Action => {
  return {
    type: TYPES.RESTORE
  }
}

export const deal = ({ bet = 10, sideBets = { luckyLucky: 0 } }: { bet: number, sideBets: any } = {}): Action => {
  return {
    type: TYPES.DEAL,
    payload: {
      bet,
      sideBets
    }
  }
}

export const insurance = ({ bet = 1 }: { bet: number }): Action => {
  return {
    type: TYPES.INSURANCE,
    payload: {
      bet
    }
  }
}

export const split = (): Action => {
  return {
    type: TYPES.SPLIT
  }
}

export const hit = ({ position = 'right' }: { position: string }): Action => {
  return {
    type: TYPES.HIT,
    payload: {
      position
    }
  }
}

export const double = ({ position = 'right' }: { position: string }): Action => {
  return {
    type: TYPES.DOUBLE,
    payload: {
      position
    }
  }
}

export const stand = ({ position = 'right' }: { position: string }): Action => {
  return {
    type: TYPES.STAND,
    payload: {
      position
    }
  }
}

export const surrender = (): Action => {
  return {
    type: TYPES.SURRENDER
  }
}

export const showdown = ({ dealerHoleCardOnly = false }: { dealerHoleCardOnly: boolean } = { }): Action => {
  return {
    type: TYPES.SHOWDOWN,
    payload: {
      dealerHoleCardOnly
    }
  }
}

export const dealerHit = ({ dealerHoleCard }: { dealerHoleCard: Card } = { }): Action => {
  return {
    type: TYPES.DEALER_HIT,
    payload: {
      dealerHoleCard
    }
  }
}

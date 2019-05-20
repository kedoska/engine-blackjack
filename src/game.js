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
import * as engine from './engine'
import type { Action, State, Hand, HandValue, Rule } from './types'
import { defaultState, getDefaultSideBets, getRules } from './presets'
const actions = require('./actions')

const appendEpoch = (obj) => {
  const { payload = { bet: 0 } } = obj
  return Object.assign(
    {},
    obj,
    {
      value: payload.bet || 0,
      ts: new Date().getTime()
    }
  )
}

export default class Game {
  state: State = {}
  dispatch: Function
  _dispatch: Function
  getState: Function
  setState: Function
  enforceRules: Function
  constructor (initialState: State, rules: Rule = getRules({})) {
    this.state = initialState ? Object.assign({}, initialState) : defaultState(rules)
    this.dispatch = this.dispatch.bind(this)
    this.getState = this.getState.bind(this)
    this.setState = this.setState.bind(this)
    this.enforceRules = this.enforceRules.bind(this)
    this._dispatch = this._dispatch.bind(this)
  }

  canDouble (double: string, playerValue: HandValue): boolean {
    if (double === 'none') {
      return false
    } else if (double === '9or10') {
      return ((playerValue.hi === 9) || (playerValue.hi === 10))
    } else if (double === '9or10or11') {
      return ((playerValue.hi >= 9) && (playerValue.hi <= 11))
    } else if (double === '9thru15') {
      return ((playerValue.hi >= 9) && (playerValue.hi <= 15))
    } else {
      return true
    }
  }

  enforceRules (handInfo: Hand): Hand {
    const { availableActions } = handInfo
    const { playerValue } = handInfo
    const { rules, history } = this.state
    if (!this.canDouble(rules.double, playerValue)) {
      availableActions.double = false
    }
    if (!rules.split) {
      availableActions.split = false
    }
    if (!rules.surrender) {
      availableActions.surrender = false
    }
    if (!rules.doubleAfterSplit) {
      if (history.some(x => x.type === TYPES.SPLIT)) {
        availableActions.double = false
      }
    }
    if (!rules.insurance) {
      availableActions.insurance = false
    }
    return handInfo
  }

  getState () : State {
    return {
      ...this.state
    }
  }

  setState (state: State): void {
    this.state = {
      ...this.state,
      ...state
    }
  }

  dispatch (action: Action): State {
    const { stage, handInfo, history } = this.state
    const { type, payload = {} } = action
    const { position = TYPES.RIGHT } = payload
    const isLeft = position === TYPES.LEFT
    const historyHasSplit = history.some(x => x.type === TYPES.SPLIT)
    const hand = handInfo[position]

    let isActionAllowed = engine.isActionAllowed(type, stage)

    if (!isActionAllowed) {
      return this._dispatch(actions.invalid(action, `${type} is not allowed when stage is ${stage}`))
    }

    const whiteList = [TYPES.RESTORE, TYPES.DEAL, TYPES.SHOWDOWN]

    if (isActionAllowed && whiteList.some(x => x === type)) {
      // this is a safe action. We do not need to check the status of the stage
      // so we return the result now!
      if (type === TYPES.DEAL && typeof payload.bet !== 'number') {
        return this._dispatch(actions.invalid(action, `${type} without bet value on stage ${stage}`))
      }
      return this._dispatch(action)
    }

    if (hand.close) {
      // TODO: consolidate this one, probably is just enough to consider the availableActions (see more below)
      return this._dispatch(actions.invalid(action, `${type} is not allowed because "${position}" side of the table is closed on "${stage}"`))
    }

    if (isLeft && !historyHasSplit) {
      // You want to do something on "left" but no split found in history.
      // default side is "right". When an action want to edit the "left" side of the table
      // a valid split should be appear in the history. If not, "left" position is not ready to be changed
      if (!history.some(x => x.type === TYPES.SPLIT)) {
        return this._dispatch(actions.invalid(action, `${type} is not allowed because there is no SPLIT in current stage "${stage}"`))
      }
    }

    if (isLeft && !handInfo.right.close) {
      // You want to do something on "left" but "right" is still open
      return this._dispatch(actions.invalid(action, `${type} is not allowed because you need to finish "left" hand "${stage}"`))
    }

    if (!hand.availableActions[type.toLowerCase()]) {
      return this._dispatch(actions.invalid(action, `${type} is not currently allowed on position "${position}". Stage is "${stage}"`))
    }

    return this._dispatch(action)
  }

  _dispatch (action: Action): State {
    switch (action.type) {
      case TYPES.DEAL: {
        const { bet, sideBets } = action.payload
        const { rules: { insurance }, availableBets, history, hits } = this.state
        const playerCards = this.state.deck.splice(this.state.deck.length - 2, 2)
        const dealerCards = this.state.deck.splice(this.state.deck.length - 1, 1)
        const dealerHoleCard = this.state.deck.splice(this.state.deck.length - 1, 1)[ 0 ]
        const dealerValue = engine.calculate(dealerCards)
        let dealerHasBlackjack = engine.isBlackjack(dealerCards.concat([dealerHoleCard]))
        const right = this.enforceRules(engine.getHandInfoAfterDeal(playerCards, dealerCards, bet))
        if (insurance && dealerValue.lo === 1) {
          dealerHasBlackjack = false
          right.availableActions = {
            ...right.availableActions,
            stand: false,
            double: false,
            hit: false,
            split: false,
            surrender: false
          }
        }
        const sideBetsInfo = engine.getSideBetsInfo(availableBets, sideBets, playerCards, dealerCards)
        const historyItem = appendEpoch({
          ...action,
          right: playerCards,
          dealerCards
        })
        this.setState({
          initialBet: bet,
          stage: TYPES.STAGE_PLAYER_TURN_RIGHT,
          dealerCards: dealerCards,
          dealerHoleCard: dealerHoleCard,
          dealerValue: dealerValue,
          dealerHasBlackjack: dealerHasBlackjack,
          deck: this.state.deck.filter(x => dealerCards
              .concat(playerCards)
              .indexOf(x) === -1),
          cardCount: engine.countCards(playerCards.concat(dealerCards)),
          handInfo: {
            left: {},
            right
          },
          sideBetsInfo: sideBetsInfo,
          availableBets: getDefaultSideBets(false),
          history: history.concat(historyItem),
          hits: hits + 1
        })

        if (
          right.playerHasBlackjack &&
          (!right.availableActions.insurance ||
            (right.availableActions.insurance && dealerValue.lo !== 1))
        ) {
          // purpose of the game achieved !!!
          this._dispatch(actions.showdown())
          break
        }
        if (dealerHasBlackjack) {
          if (!right.availableActions.insurance) {
            // nothing left, let's go and tell the customer he loses this game
            this._dispatch(actions.showdown())
          }
        // else
        // in this case, the game must continue in "player-turn-right"
        // waiting for the insurance (including even money) action
        }
        break
      }
      case TYPES.INSURANCE: {
        const { bet = 0 } = action.payload
        const { sideBetsInfo, handInfo, dealerCards, dealerHoleCard, initialBet, history, hits } = this.state
        const dealerHasBlackjack = engine.isBlackjack(dealerCards.concat([dealerHoleCard]))
        const insuranceValue = bet > 0 ? initialBet / 2 : 0
        const isFirstCardAce = dealerCards[0].value === 1
        const insurancePrize = (isFirstCardAce && dealerHasBlackjack && insuranceValue > 0 && bet > 0) ? insuranceValue * 3 : 0
        const right = this.enforceRules(engine.getHandInfoAfterInsurance(handInfo.right.cards, dealerCards))
        right.bet = initialBet
        const tookEvenMoney = insuranceValue > 0 && handInfo.right.playerHasBlackjack
        right.close = dealerHasBlackjack || tookEvenMoney
        const historyItem = appendEpoch({
          ...action,
          payload: { bet: insuranceValue || 0 }
        })
        this.setState({
          handInfo: { left: {}, right },
          history: history.concat(historyItem),
          hits: hits + 1,
          sideBetsInfo: {
            ...sideBetsInfo,
            insurance: {
              risk: insuranceValue,
              win: insurancePrize
            }
          }
        })
        if (dealerHasBlackjack || tookEvenMoney) {
          this._dispatch(actions.showdown())
        }
        break
      }
      case TYPES.SPLIT: {
        const { rules, initialBet, handInfo, dealerCards, history, hits } = this.state
        let deck = this.state.deck
        const playerCardsLeftPosition = [handInfo.right.cards[ 0 ]]
        const playerCardsRightPosition = [handInfo.right.cards[ 1 ]]
        const forceShowdown = rules.showdownAfterAceSplit && playerCardsRightPosition[ 0 ].value === 1
        let cardRight = deck.splice(deck.length - 2, 1)
        let cardLeft = deck.splice(deck.length - 1, 1)
        deck = deck.filter(x => [ cardLeft, cardRight ].indexOf(x) === -1)
        playerCardsLeftPosition.push(cardLeft[ 0 ])
        playerCardsRightPosition.push(cardRight[ 0 ])
        const historyItem = appendEpoch({
          ...action,
          payload: { bet: initialBet },
          left: playerCardsLeftPosition,
          right: playerCardsRightPosition
        })
        let left = this.enforceRules(engine.getHandInfoAfterSplit(playerCardsLeftPosition, dealerCards, initialBet))
        let right = this.enforceRules(engine.getHandInfoAfterSplit(playerCardsRightPosition, dealerCards, initialBet))
        let stage = ''
        if (forceShowdown) {
          stage = TYPES.STAGE_SHOWDOWN
          left.close = true
          right.close = true
        } else {
          if (right.close) {
            stage = TYPES.STAGE_PLAYER_TURN_LEFT
          } else {
            stage = TYPES.STAGE_PLAYER_TURN_RIGHT
          }
        }
        if (right.close && left.close) {
          stage = TYPES.STAGE_SHOWDOWN
        }
        this.setState({
          stage: stage,
          handInfo: {
            left,
            right
          },
          deck: deck,
          history: history.concat(historyItem),
          hits: hits + 1
        })
        if (stage === TYPES.STAGE_SHOWDOWN) {
          this._dispatch(actions.showdown())
        }
        break
      }
      case TYPES.HIT: {
        let stage = ''
        const { initialBet, deck, handInfo, dealerCards, cardCount, history, hits } = this.state
        const position = action.payload.position
        const card = deck.splice(deck.length - 1, 1)
        let playerCards = []
        let left = {}
        let right = {}
        const hasSplit = history.some(x => x.type === TYPES.SPLIT)
        if (position === TYPES.LEFT) {
          playerCards = handInfo.left.cards.concat(card)
          left = engine.getHandInfoAfterHit(playerCards, dealerCards, initialBet, hasSplit)
          right = Object.assign({}, handInfo.right)
          if (left.close) {
            stage = TYPES.STAGE_SHOWDOWN
          } else {
            stage = `player-turn-${position}`
          }
        } else {
          playerCards = handInfo.right.cards.concat(card)
          right = engine.getHandInfoAfterHit(playerCards, dealerCards, initialBet, hasSplit)
          left = Object.assign({}, handInfo.left)
          if (right.close) {
            if (history.some(x => x.type === TYPES.SPLIT)) {
              stage = TYPES.STAGE_PLAYER_TURN_LEFT
            } else {
              stage = TYPES.STAGE_SHOWDOWN
            }
          } else {
            stage = `player-turn-${position}`
          }
          if (right.close && left.close) {
            stage = TYPES.STAGE_SHOWDOWN
          }
        }
        const objCards = {}
        objCards[position] = playerCards
        const historyItem = appendEpoch({
          ...action,
          ...objCards
        })
        this.setState({
          stage: stage,
          handInfo: { left, right },
          deck: deck.filter(x => playerCards.indexOf(x) === -1),
          cardCount: cardCount + engine.countCards(card),
          history: history.concat(historyItem),
          hits: hits + 1
        })
        if (stage === TYPES.STAGE_SHOWDOWN) {
          this._dispatch(actions.showdown())
        }
        break
      }
      case TYPES.DOUBLE: {
        let stage = ''
        const { initialBet, deck, handInfo, dealerCards, cardCount, history, hits } = this.state
        const position = action.payload.position
        const card = deck.splice(deck.length - 1, 1)
        let playerCards: Array<card> = []
        let left = {}
        let right = {}
        const hasSplit = history.some(x => x.type === TYPES.SPLIT)
        // TODO: remove position and replace it with stage info #hit
        if (position === TYPES.LEFT) {
          right = Object.assign({}, handInfo.right)
          playerCards = handInfo.left.cards.concat(card)
          left = engine.getHandInfoAfterDouble(playerCards, dealerCards, initialBet, hasSplit)
          if (left.close) {
            stage = TYPES.STAGE_SHOWDOWN
          } else {
            stage = `player-turn-${position}`
          }
        } else {
          playerCards = handInfo.right.cards.concat(card)
          left = Object.assign({}, handInfo.left)
          right = engine.getHandInfoAfterDouble(playerCards, dealerCards, initialBet, hasSplit)
          if (right.close) {
            if (history.some(x => x.type === TYPES.SPLIT)) {
              stage = TYPES.STAGE_PLAYER_TURN_LEFT
            } else {
              stage = TYPES.STAGE_SHOWDOWN
            }
          } else {
            stage = `player-turn-${position}`
          }
        }
        const objCards = {}
        objCards[position] = playerCards
        const historyItem = appendEpoch({
          ...action,
          payload: { bet: initialBet },
          ...objCards
        })
        this.setState({
          stage: stage,
          handInfo: { left, right },
          deck: deck.filter(x => playerCards.indexOf(x) === -1),
          cardCount: cardCount + engine.countCards(card),
          history: history.concat(historyItem),
          hits: hits + 1
        })
        this._dispatch(actions.stand(position))
        break
      }
      case TYPES.STAND: {
        let stage = ''
        const { handInfo, history, hits } = this.state
        const position = action.payload.position
        let left = {}
        let right = {}
        const hasSplit = history.some(x => x.type === TYPES.SPLIT)
        if (position === TYPES.LEFT) {
          right = Object.assign({}, handInfo.right)
          left = engine.getHandInfoAfterStand(handInfo.left)
          stage = TYPES.STAGE_SHOWDOWN
        }
        if (position === TYPES.RIGHT) {
          left = Object.assign({}, handInfo.left)
          right = engine.getHandInfoAfterStand(handInfo.right)
          if (right.close) {
            stage = TYPES.STAGE_SHOWDOWN
          }
        }
        if (hasSplit) {
          stage = stage !== TYPES.STAGE_SHOWDOWN ? TYPES.STAGE_PLAYER_TURN_LEFT : TYPES.STAGE_SHOWDOWN
        }
        if (hasSplit && !left.close) {
          stage = TYPES.STAGE_PLAYER_TURN_LEFT
        }
        const historyItem = appendEpoch(action)
        this.setState({
          stage,
          handInfo: { left, right },
          history: history.concat(historyItem),
          hits: hits + 1
        })
        if (stage === TYPES.STAGE_SHOWDOWN) {
          this._dispatch(actions.showdown())
        }
        break
      }
      case TYPES.SHOWDOWN: {
        const { dealerHoleCard, handInfo, history, hits } = this.state
        const { dealerHoleCardOnly } = action.payload
        const historyItem = appendEpoch(action)
        this.setState({
          stage: TYPES.STAGE_DEALER_TURN,
          history: history.concat(historyItem),
          hits: hits + 1
        })
        // we want to include in the calculation the dealerHoleCard obtained in initial deal()
        this._dispatch(actions.dealerHit({ dealerHoleCard: dealerHoleCard }))
        if (dealerHoleCardOnly) {
          this.setState({
            stage: TYPES.STAGE_DONE,
            ...engine.getPrizes(this.state)
          })
          break
        }
        const checkLeftStatus = history.some(x => x.type === TYPES.SPLIT)
        const check1 = (handInfo.right.playerHasBusted || handInfo.right.playerHasBlackjack) && !checkLeftStatus
        if (check1) {
          this.setState({
            stage: TYPES.STAGE_DONE,
            ...engine.getPrizes(this.state)
          })
          break
        }
        const check2 = checkLeftStatus && (handInfo.left.playerHasBusted || handInfo.left.playerHasBlackjack) && check1
        if (check2) {
          this.setState({
            stage: TYPES.STAGE_DONE,
            ...engine.getPrizes(this.state)
          })
          break
        }
        if (checkLeftStatus && handInfo.left.playerHasBusted && handInfo.right.playerHasBusted) {
          this.setState({
            stage: TYPES.STAGE_DONE,
            ...engine.getPrizes(this.state)
          })
          break
        }
        while (this.getState().stage === TYPES.STAGE_DEALER_TURN) {
          this._dispatch(actions.dealerHit())
        }
        this.setState({
          ...engine.getPrizes(this.state)
        })
        break
      }
      case TYPES.SURRENDER: {
        const { handInfo, history, hits } = this.state
        handInfo.right = engine.getHandInfoAfterSurrender(handInfo.right)
        const historyItem = appendEpoch(action)
        this.setState({
          stage: TYPES.STAGE_SHOWDOWN,
          handInfo: handInfo,
          history: history.concat(historyItem),
          hits: hits + 1
        })
        this._dispatch(actions.showdown({ dealerHoleCardOnly: true }))
        break
      }
      case TYPES.DEALER_HIT: {
        const { rules, deck, cardCount, history, hits } = this.state
        // the new card for dealer can be the "dealerHoleCard" or a new card
        // dealerHoleCard was set at the deal()
        const { dealerHoleCard } = action.payload
        const card = dealerHoleCard || deck.splice(deck.length - 1, 1)[ 0 ]
        const dealerCards = this.state.dealerCards.concat([card])
        const dealerValue = engine.calculate(dealerCards)
        const dealerHasBlackjack = engine.isBlackjack(dealerCards)
        const dealerHasBusted = dealerValue.hi > 21
        let stage = null
        if (dealerValue.hi < 17) {
          stage = TYPES.STAGE_DEALER_TURN
        } else {
          if (!rules.standOnSoft17 && engine.isSoftHand(dealerCards)) {
            stage = TYPES.STAGE_DEALER_TURN
          } else {
            stage = TYPES.STAGE_DONE
          }
        }
        const historyItem = appendEpoch({
          ...action,
          dealerCards
        })
        this.setState({
          stage: stage,
          dealerCards: dealerCards,
          dealerValue: dealerValue,
          dealerHasBlackjack: dealerHasBlackjack,
          dealerHasBusted: dealerHasBusted,
          deck: deck.filter(x => dealerCards.indexOf(x) === -1),
          cardCount: cardCount + engine.countCards([card]),
          history: history.concat(historyItem),
          hits: hits + 1
        })
        break
      }
      default: {
        const { history, hits } = this.state
        const historyItem = appendEpoch(action)
        this.setState({
          hits: hits + 1,
          history: history.concat(historyItem)
        })
        break
      }
    }
    return this.getState()
  }
}

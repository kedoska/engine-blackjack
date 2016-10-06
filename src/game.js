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

const engine = require('./engine')
const actions = require('../src/actions')

const defaultState = () => {
  return {
    hits: 0,
    stage: 'ready',
    deck: engine.shuffle(engine.newDeck()),
    handInfo: {
      left: {},
      right: {}
    },
    history: []
  }
}

const appendEpoch = (obj) => {
  return Object.assign(
    {},
    obj,
    {
      ts: new Date().getTime()
    }
  )
}

class Game {
  constructor (initialState) {
    this.state = initialState || defaultState()
  }

  getState () {
    return Object.assign({}, this.state)
  }

  setState (state) {
    this.state = Object.assign(this.state, state)
  }

  dispatch (action) {
    const { stage, handInfo, history } = this.state
    const { type, payload = {} } = action
    const { position = 'right' } = payload
    const isRight = position === 'right'
    const isLeft = position === 'left'
    const historyHasSplit = history.some(x => x.type === 'SPLIT')
    const hand = handInfo[position]

    let isActionAllowed = engine.isActionAllowed(type, stage)

    console.log(`stage is "${stage}", you want to ${type} on ${position}: is it allowed? ${isActionAllowed}`)

    if (!isActionAllowed) {
      return this._dispatch(actions.invalid(action, `${type} is not allowed when stage is ${stage}`))
    }

    const whiteList = ['RESTORE', 'DEAL', 'SHOWDOWN']

    if (isActionAllowed && whiteList.some(x => x === type)) {
      // this is a safe action. We do not need to check the status of the stage
      // so we return the result now!
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
      if (!history.some(x => x.type === 'SPLIT')) {
        return this._dispatch(actions.invalid(action, `${type} is not allowed because there is no SPLIT in current stage "${stage}"`))
      }
    }

    if (!hand.availableActions[type.toLowerCase()]) {
      return this._dispatch(actions.invalid(action, `${type} is not currently allowed on position "${position}". Stage is "${stage}"`))
    }

    return this._dispatch(action)
  }

  _dispatch (action) {
    switch (action.type) {
      case 'DEAL': {
        const { history, hits } = this.state
        const playerCards = this.state.deck.splice(this.state.deck.length - 2, 2)
        const dealerCards = this.state.deck.splice(this.state.deck.length - 1, 1)
        const dealerValue = engine.calculate(dealerCards)
        const dealerHasBlackjack = dealerValue === 21
        const handInfo = engine.getHandInfoAfterDeal(playerCards, dealerCards)
        history.push(appendEpoch(action))
        this.setState({
          stage: 'player-turn-right',
          dealerCards: dealerCards,
          dealerValue: dealerValue,
          dealerHasBlackjack: dealerHasBlackjack,
          playerHasBlackjack: handInfo.playerHasBlackjack,
          deck: this.state.deck.filter(x => dealerCards
              .concat(playerCards)
              .indexOf(x) === -1),
          cardCount: engine.countCards(playerCards.concat(dealerCards)),
          handInfo: {
            left: {},
            right: handInfo
          },
          history: history,
          hits: hits + 1
        })
        break
      }
      case 'SPLIT': {
        const { handInfo, dealerCards, history, hits } = this.state
        const playerCardsLeftPosition = [ handInfo.right.cards[ 0 ]]
        const playerCardsRightPosition = [ handInfo.right.cards[ 1 ]]
        history.push(appendEpoch(action))
        this.setState({
          playerHasBlackjack: false,
          handInfo: {
            left: engine.getHandInfoAfterSplit(playerCardsLeftPosition, dealerCards),
            right: engine.getHandInfoAfterSplit(playerCardsRightPosition, dealerCards)
          },
          history: history,
          hits: hits + 1
        })
        this.dispatch(actions.hit('right'))
        this.dispatch(actions.hit('left'))
        this.setState({
          stage: 'player-turn-right'
        })
        break
      }
      case 'HIT': {
        let stage = ''
        const { deck, handInfo, dealerCards, cardCount, history, hits } = this.state
        const position = action.payload.position
        const card = deck.splice(deck.length - 1, 1)
        let playerCards = null
        // TODO: remove position and replace it with stage info #hit
        if (position === 'left') {
          playerCards = handInfo.left.cards.concat(card)
          handInfo.left = engine.getHandInfoAfterHit(playerCards, dealerCards)
          if (handInfo.left.close) {
            stage = 'showdown'
          } else {
            stage = `player-turn-${position}`
          }
        } else {
          playerCards = handInfo.right.cards.concat(card)
          handInfo.right = engine.getHandInfoAfterHit(playerCards, dealerCards)
          if (handInfo.right.close) {
            if (history.some(x => x.type === 'SPLIT')) {
              stage = 'player-turn-left'
            } else {
              stage = 'showdown'
            }
          } else {
            stage = `player-turn-${position}`
          }
        }
        history.push(appendEpoch(action))
        this.setState({
          stage: stage,
          handInfo: handInfo,
          deck: deck.filter(x => playerCards.indexOf(x) === -1),
          cardCount: cardCount + engine.countCards(card),
          history: history,
          hits: hits + 1
        })
        if (stage === 'showdown') {
          this.dispatch(actions.showdown())
        }
        break
      }
      case 'STAND': {
        let stage = ''
        const { handInfo, history, hits } = this.state
        const position = action.payload.position
        // TODO: remove position and replace it with stage info #hit
        if (position === 'left') {
          handInfo.left = engine.getHandInfoAfterStand(handInfo.left)
          stage = 'showdown'
        } else {
          handInfo.right = engine.getHandInfoAfterStand(handInfo.right)
          if (history.some(x => x.type === 'SPLIT')) {
            stage = 'player-turn-left'
          } else {
            stage = 'showdown'
          }
        }
        history.push(appendEpoch(action))
        this.setState({
          stage: stage,
          handInfo: handInfo,
          history: history,
          hits: hits + 1
        })
        if (stage === 'showdown') {
          this.dispatch(actions.showdown())
        }
        break
      }
      case 'SHOWDOWN': {
        const { history, hits } = this.state
        history.push(appendEpoch(action))
        this.setState({
          stage: 'dealer-turn',
          history: history,
          hits: hits + 1
        })
        do {
          this._dispatch(actions.dealerHit())
        } while (this.getState().stage === 'dealer-turn')
        break
      }
      case 'DEALER-HIT': {
        const { deck, cardCount, history, hits } = this.state
        const card = deck.splice(deck.length - 1, 1)
        const dealerCards = this.state.dealerCards.concat(card)
        const dealerValue = engine.calculate(dealerCards)
        let stage = null
        if (dealerValue < 17) {
          stage = 'dealer-turn'
        } else {
          stage = 'done'
        }
        history.push(appendEpoch(action))
        this.setState({
          stage: stage,
          dealerCards: dealerCards,
          dealerValue: dealerValue,
          deck: deck.filter(x => dealerCards.indexOf(x) === -1),
          cardCount: cardCount + engine.countCards(card),
          history: history,
          hits: hits + 1
        })
        break
      }
      default: {
        const { history, hits } = this.state
        history.push(appendEpoch(action))
        this.setState({
          hits: hits + 1,
          history: history
        })
        break
      }
    }
    return this.getState()
  }
}

module.exports = Game

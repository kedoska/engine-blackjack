/*!
 * engine-blackjack
 * Copyright(c) 2016 Marco Casula
 * GPL 2.0 Licensed
 */

const engine = require('./engine')
const actions = require('../src/actions')

const defaultState = () => {
  return {
    hits: 0,
    stage: 'ready',
    deck: engine.shuffle(engine.newDeck()),
    handInfo: {
      left: null,
      right: null
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
    console.log('---------------------------------------', action)
    switch (action.type) {
      case 'DEAL': {
        const { history, hits } = this.state
        const playerCards = this.state.deck.splice(this.state.deck.length - 2, 2)
        const dealerCards = this.state.deck.splice(this.state.deck.length - 1, 1)
        const dealerValue = engine.calculate(dealerCards)
        const dealerHasBlackjack = dealerValue === 21
        const handInfo =  engine.getHandInfoAfterDeal(playerCards, dealerCards)
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
            left: [],
            right: handInfo
          },
          history: history,
          hits: hits + 1
        })
        break
      }
      case 'SPLIT': {
        const { handInfo, dealerCards, history, hits } = this.state
        const playerCardsLeftPosition = [ handInfo.right.cards[ 0 ] ]
        const playerCardsRightPosition = [ handInfo.right.cards[ 1 ] ]
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
        const { deck, handInfo, dealerCards, cardCount, history, hits } = this.state
        const position = action.payload.position
        const card = deck.splice(deck.length - 1, 1)
        let playerCards = null
        if (position === 'left') {
          playerCards = handInfo.left.cards.concat(card)
          handInfo.left = engine.getHandInfoAfterHit(playerCards, dealerCards)
        } else {
          playerCards = handInfo.right.cards.concat(card)
          handInfo.right = engine.getHandInfoAfterHit(playerCards, dealerCards)
        }
        history.push(appendEpoch(action))
        this.setState({
          stage: `player-turn-${position}`,
          handInfo: handInfo,
          deck: deck.filter(x => playerCards.indexOf(x) === -1),
          cardCount: cardCount + engine.countCards(card),
          history: history,
          hits: hits + 1
        })
        break
      }
      case 'STAND': {
        let stage = ''
        const { handInfo, history, hits } = this.state
        const position = action.payload.position
        if (position === 'left') {
          handInfo.left = engine.getHandInfoAfterStand(handInfo.left)
          stage = 'showdown'
        } else {
          handInfo.right = engine.getHandInfoAfterStand(handInfo.right)
          if (history.some(x => x.type === 'SPLIT')) {
            stage = 'player-turn-left'
          } else{
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
          this.dispatch(actions.dealerHit())
        } while (this.getState().stage === 'dealer-turn')
        break
      }
      case 'DEALER-HIT': {
        const { deck, cardCount, history, hits } = this.state
        const card = deck.splice(deck.length - 1, 1)
        const dealerCards = this.state.dealerCards.concat(card)
        const dealerValue = engine.calculate(dealerCards)
        let stage = null
        if (dealerValue < 21) {
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
    }
    return this.getState()
  }
}

module.exports = Game

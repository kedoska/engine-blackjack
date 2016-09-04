/*!
 * engine-blackjack
 * Copyright(c) 2016 Marco Casula
 * GPL 2.0 Licensed
 */

const engine = require('./engine')

const defaultState = () => {
  return {
    hits: 0,
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
    console.log(action)
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
          stage: 'player-turn-right',
          playerHasBlackjack: false,
          handInfo: {
            left: engine.getHandInfoAfterSplit(playerCardsLeftPosition, dealerCards),
            right: engine.getHandInfoAfterSplit(playerCardsRightPosition, dealerCards)
          },
          history: history,
          hits: hits + 1
        })
        break
      }
      case 'HIT': {
        const { deck, handInfo, dealerCards, history, hits } = this.state
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

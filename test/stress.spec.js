import crypto from 'crypto'
import { calculate, isBlackjack } from '../src/engine'
const deck = require('52-deck')
deck.getRandom = (min, max) => {
  let number
  const range = max - min + 1
  do
  {
    const buffer = crypto.randomBytes(4)
    number = buffer.readUInt8(0)
  }
  while (number >= Number.MAX_VALUE - (Number.MAX_VALUE % range))
  number %= range
  return number + min
}

const simulate = (decks = 1) => {
  const cards = deck.shuffle(deck.newDeck())
  const playerCards = cards.splice(cards.length - 2, 2)
  const dealerFirstCards = cards.splice(cards.length - 1, 1)
  const dealerHoleCard = cards.splice(cards.length - 1, 1)[ 0 ]
  const dealerCards = dealerFirstCards.concat([dealerHoleCard])
  const playerHasBlackjack = isBlackjack(playerCards)
  const dealerHasBlackjack = isBlackjack(dealerCards)
  return {
    playerHasBlackjack,
    dealerHasBlackjack
  }
}

describe.only('Probabilities', () => {
  describe('Served blackjack', () => {
    it('should be around 4%', () => {
      const MAX = 10000
      let p = 0
      let d = 0
      for(let i = 0; i < MAX; i ++) {
        const { playerHasBlackjack, dealerHasBlackjack } = simulate(1)
        p = playerHasBlackjack ? p + 1 : p
        d = dealerHasBlackjack ? d + 1 : d
      }
      p = (p / MAX) * 100
      d = (d/ MAX) * 100
      expect(p).toBeGreaterThanOrEqual(4)
      expect(p).toBeLessThanOrEqual(6)

      expect(d).toBeGreaterThanOrEqual(4)
      expect(d).toBeLessThanOrEqual(6)
    })
  })
})
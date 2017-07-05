import crypto from 'crypto'
import { calculate, isBlackjack, getHigherValidValue } from '../src/engine'
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

describe('Probabilities', () => {
  describe('Served blackjack', () => {
    [1,2,4,6,8].forEach(numberOfDecks => {
      it(`should be around 4% with ${numberOfDecks} deck/s`, () => {
        const MAX = 10000
        let p = 0
        let d = 0
        for(let i = 0; i < MAX; i ++) {
          const cards = deck.shuffle(deck.newDecks(numberOfDecks))
          const playerCards = cards.splice(cards.length - 2, 2)
          const dealerFirstCards = cards.splice(cards.length - 1, 1)
          const dealerHoleCard = cards.splice(cards.length - 1, 1)[ 0 ]
          const dealerCards = dealerFirstCards.concat([dealerHoleCard])
          const playerHasBlackjack = isBlackjack(playerCards)
          const dealerHasBlackjack = isBlackjack(dealerCards)
          p = playerHasBlackjack ? p + 1 : p
          d = dealerHasBlackjack ? d + 1 : d
        }
        p = (p / MAX) * 100
        d = (d / MAX) * 100
        expect(p).toBeGreaterThanOrEqual(4)
        expect(p).toBeLessThanOrEqual(6)

        expect(d).toBeGreaterThanOrEqual(4)
        expect(d).toBeLessThanOrEqual(6)
      })
    })
  })
  describe('Dealer bust after deal and player stand', () => {
    [1,2,4,6,8].forEach(numberOfDecks => {
      it(`should be between 22 and 32% with ${numberOfDecks} deck/s`, () => {
        const MAX = 1000
        let numberOfBustedGames = 0
        let numberOfDealerWinningGames = 0
        let numberOfPlayerWinningGames = 0
        let numberOfPushGames = 0
        for (let i = 0; i < MAX; i++) {
          const cards = deck.shuffle(deck.newDecks(numberOfDecks))
          const playerCards = cards.splice(cards.length - 2, 2)
          const dealerFirstCards = cards.splice(cards.length - 1, 1)
          const dealerHoleCard = cards.splice(cards.length - 1, 1)[0]
          let dealerCards = dealerFirstCards.concat([dealerHoleCard])
          const pV = getHigherValidValue(calculate(playerCards))
          let dV = getHigherValidValue(calculate(dealerCards))
          while (dV < 17){
            const nextCard = cards.splice(cards.length - 1, 1)[0]
            dealerCards = dealerCards.concat([nextCard])
            dV = getHigherValidValue(calculate(dealerCards))
          }
          let dealerHasBusted = dV > 21

          if (dealerHasBusted) {
            numberOfBustedGames++
          }
          if (!dealerHasBusted && dV > pV) {
            numberOfDealerWinningGames++
          }
          if (pV > dV || dealerHasBusted) {
            numberOfPlayerWinningGames++
          }
          if (!dealerHasBusted && dV === pV) {
            numberOfPushGames++
          }
        }
        numberOfBustedGames = (numberOfBustedGames / MAX) * 100
        expect(numberOfBustedGames).toBeGreaterThanOrEqual(22)
        expect(numberOfBustedGames).toBeLessThanOrEqual(32)
        expect(numberOfPlayerWinningGames).toBeLessThan(numberOfDealerWinningGames)
      })
    })
  })
})
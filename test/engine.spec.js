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

const assert = require('assert')
const lib = require('../src/engine')

describe('utils', function () {
  describe('# serializeCard()', function () {
    it('should convert a string to a card object', function () {
      assert.deepStrictEqual(lib.serializeCard('1-h'), {
        text: 'A',
        suite: 'hearts',
        value: 1
      }, 'serialize 1-h')
      assert.deepStrictEqual(lib.serializeCard('h2'), {
        text: '2',
        suite: 'hearts',
        value: 2
      }, 'serialize h2')
      assert.deepStrictEqual(lib.serializeCard('♣1'), {
        text: 'A',
        suite: 'clubs',
        value: 1
      }, 'serialize ♣1')
      assert.deepStrictEqual(lib.serializeCard('12spades'), {
        text: 'Q',
        suite: 'spades',
        value: 10
      }, 'serialize 12spades')
      assert.deepStrictEqual(lib.serializeCard('♦K'), {
        text: 'K',
        suite: 'diamonds',
        value: 10
      }, 'serialize ♦K')
    })
  })
  describe('# serializeCards()', function () {
    it('should convert a string to an array of card objects', function () {
      assert.deepStrictEqual(lib.serializeCards('h1 s1'), [
        {
          text: 'A',
          suite: 'hearts',
          value: 1
        },
        {
          text: 'A',
          suite: 'spades',
          value: 1
        }
      ], 'serialize h1 s1')
    })
  })
})

describe('deck methods: newDeck(), shuffle() and calculate()', function () {
  it('should return and array of 52 card objects', function () {
    assert.equal(lib.newDeck().length, 52)
  })

  it('should return a cloned and shuffled array of card objects', function () {
    const a = lib.newDeck()
    const b = lib.shuffle(a)
    assert.notDeepStrictEqual(a, b)
    assert.equal(b.length, a.length)
  })

  describe('blackjack', function () {
    [
      '♥1 ♣10 ♥K',
      '♥1 ♣J',
      '♣2 ♥1 ♠1 ♦1 ♥4 ♦2'
    ]
      .forEach(function (value) {
        it(`${value}`, function () {
          const cards = lib.serializeCards(value)
          const result = lib.calculate(cards)
          assert.equal(result, 21)
        })
      })
  })
})

describe('prize calculation', function () {
  it('should pay according the standard game rule (no BJ)', function () {
    const cards = lib.serializeCards('♠J ♣9')
    const playerValue = lib.calculate(cards)
    const initialBet = 1
    const playerHand = {
      close: true,
      playerHasSurrendered: false,
      playerHasBlackjack: false,
      playerHasBusted: false,
      playerValue: playerValue,
      bet: initialBet
    }
    assert.equal(lib.getPrize(playerHand, 18), initialBet * 2, 'player Won twice')
    assert.equal(lib.getPrize(playerHand, 19), initialBet, 'player Push (bet value is returned')
    assert.equal(lib.getPrize(playerHand, 20), 0, 'player lose')
  })
})

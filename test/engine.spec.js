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
import { serializeCards } from '52-deck'
import * as lib from '../src/engine'

describe('calculate()', function () {
  it('should return hi/lo value when cards contains "Ace"', function () {
    const cards = serializeCards('♠1 ♥5')
    const values = lib.calculate(cards)
    assert.equal(values.hi, 16, 'hi')
    assert.equal(values.lo, 6, 'lo')
  })

  it('should return hi/lo value when cards contains 2 "Aces"', function () {
    const cards = serializeCards('♠1 ♣5 ♣1')
    const values = lib.calculate(cards)
    assert.equal(values.hi, 17, 'hi')
    assert.equal(values.lo, 7, 'lo')
  })

  describe('blackjack', function () {
    [
      '♥1 ♣10 ♥K',
      '♥1 ♣J',
      '♣2 ♥1 ♠1 ♦1 ♥4 ♦2'
    ]
      .forEach(function (value) {
        it(`${value}`, function () {
          const cards = serializeCards(value)
          const result = lib.calculate(cards).hi
          assert.equal(result, 21)
        })
      })
  })
})

describe('prize calculation', function () {
  it('should pay according the standard game rule (no BJ)', function () {
    const playerCards = serializeCards('♠J ♣9')
    const playerValue = lib.calculate(playerCards)
    const dealerCards = serializeCards('♣J ♣8')
    const initialBet = 1
    const playerHand = {
      close: true,
      playerInsuranceValue: 0,
      playerHasSurrendered: false,
      playerHasBlackjack: false,
      playerHasBusted: false,
      playerValue: playerValue,
      bet: initialBet
    }
    assert.equal(lib.getPrize(playerHand, dealerCards), initialBet * 2, 'player Won twice')
    assert.equal(lib.getPrize(playerHand, dealerCards.concat(serializeCards('♥1'))), initialBet, 'player Push (bet value is returned')
    assert.equal(lib.getPrize(playerHand, dealerCards.concat(serializeCards('♥2'))), 0, 'player lose')
  })
  it('should pay insurance when dealer has BJ', function () {
    const playerCards = serializeCards('2d 3d')
    const playerValue = lib.calculate(playerCards)
    const dealerCards = serializeCards('1d 11d')
    const initialBet = 10
    const playerHand = {
      close: true,
      playerInsuranceValue: 5,
      playerHasSurrendered: false,
      playerHasBlackjack: false,
      playerHasBusted: false,
      playerValue: playerValue,
      bet: initialBet
    }
    const prize = lib.getPrize(playerHand, dealerCards)
    assert.equal(prize, 0, `insurance does not pay on right side`)
  })
  it('should NOT pay insurance when dealer has BJ and first card is NOT Ace', function () {
    const playerCards = serializeCards('2d 3d')
    const playerValue = lib.calculate(playerCards)
    const dealerCards = serializeCards('11d 1d')
    const initialBet = 10
    const insuranceBet = 5
    const playerHand = {
      close: true,
      playerInsuranceValue: 5,
      playerHasSurrendered: false,
      playerHasBlackjack: false,
      playerHasBusted: false,
      playerValue: playerValue,
      bet: initialBet
    }
    const prize = lib.getPrize(playerHand, dealerCards)
    assert.equal(lib.isBlackjack(dealerCards), true, 'dealer has blackjack')
    assert.notEqual(dealerCards[0].value, 1, 'first cards IS NOT an Ace')
    assert.equal(prize, insuranceBet * 0, `it should not pay insurance when first card is not Ace`)
  })
  it('should NOT pay BJ after split', function () {
    const hasSplit = true
    const playerCards = serializeCards('1d 10d')
    const playerValue = lib.calculate(playerCards)
    const dealerCards = serializeCards('10d 7d')
    const initialBet = 10
    const playerHand = {
      close: true,
      playerInsuranceValue: 5,
      playerHasSurrendered: false,
      playerHasBlackjack: lib.isBlackjack(playerCards) && hasSplit === false,
      playerHasBusted: false,
      playerValue: playerValue,
      bet: initialBet
    }
    const prize = lib.getPrize(playerHand, dealerCards)
    assert.equal(lib.isBlackjack(dealerCards), false, 'dealer has not blackjack')
    assert.equal(prize, initialBet * 2, `it should pay double, not bonus`)
  })
})

describe('Soft Hand', function () {
  describe('# are all soft hands', function () {
    [
      '1d 3d 3s',
      '1d 6h',
      '1d 2h 4h',
      '1d 1h 5s'
    ].forEach(cards => {
      it(cards, function () {
        assert.ok(lib.isSoftHand(serializeCards(cards)))
      })
    })
  })
  describe('# are not soft hands', function () {
    [
      '10d 7d',
      '7d 9h',
      '5d 2h 9h'
    ].forEach(cards => {
      it(cards, function () {
        assert.ok(!lib.isSoftHand(serializeCards(cards)))
      })
    })
  })
})
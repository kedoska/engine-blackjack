/*!
 * engine-blackjack
 * Copyright(c) 2016 Marco Casula
 * GPL 2.0 Licensed
 */

'use strict'

module.exports = require('./src/engine')
module.exports = {
  engine: require('./src/engine'),
  actions: require('./src/actions'),
  Game: require('./src/game')
}
engine-blackjack
================

Nodejs module to implement the blackjack game into your software.

NOTE: Master branch is under development. Be sure to "ONLY" use tagged version for your production.

Main motivation of this side project is understand the basics of the games and provide a very 
simple library that can be easily integrated in more complex systems.

### Guidelines that I follow

Inspired by projects done by people I consider smart, like Flux or Redux, 
and motivated by the desire to introduce the functional paradigm in my work day:

 1. platform agnostic (if you can run Node, you are ok. Node can run everywhere)
 2. zero-dependencies (only dev-dependencies)
 3. TDD, break every single game action to be testable
 4. Implement everything that makes sense (and described in [WikipediA](https://en.wikipedia.org/wiki/Blackjack))

## Project Structure

Everything you need to hack is of course inside `/src` or `/test` and 
`npm test` does what you expect (plus a lot of console.log for the moment)

### Actions

see the `/src/actions.js`

Engine exposes _actions_, once invoked, the state of the game is changed.
The following list represent the _actions_ that can be _dispatched_ by from the public API.

 * restore
 * deal
 * split
 * hit
 * stand

And, those are _actions_ that are internally called in determinate _stages_ by the engine itself.

 * showdown
 * dealerHit
 * invalid
 
### Stages

see the `/src/game.js`

The stage represent a moment in the round of the game. The stage is directly related with the action allowed in that particular moment.

Current available stages are:

 * ready
 * player-turn-left
 * player-turn-right (optional)
 * showdown
 * dealer-turn

### logic

The game logic is implemented into `/src/engine.js`. There some more methods, strictly related to the _tests_ and for the moment are not tested (_who test the test_ is not yet solved).
There is a specific design limitation currently in the code. Currently it support only 2 position, user can "split" but it is not possible at the moment to create more complex variants of the game.

NOTE: If you are interested in the random components, check out the `shuffle()` function.

## TODOs

Thinking in LTS, this is the list of blackjack variants to be included:

 * Blackjack Switch
 * Double Exposure
 * European

Ideally as per my other side projects, the engine should be configured so that _actions_ and _dispatchers_ can works according the desired configuration.

NOTE: The effort to do this, at least for me (and considering the time I can spend doing this) is quite big.

## Contributing

All kinds of contributions are welcome.
You can contributing by finding issues and open and issue or email me or by coding something:

 1. Fork it!
 2. Create your featured branch: `git checkout -b my-feature`
 3. Commit your changes: `git commit -am 'add some feature'`
 4. Push to the branch: `git push origin my-feature`
 5. Submit a pull request (and thanks) :)

# License

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

engine-blackjack
================

Nodejs module to implement the blackjack game into your software. It is intended to be used as
server-side component to calculate the status of a game.

Main motivation of this side project is understand the basics of the games and provide a very 
simple library that can be easily integrated in more complex systems.

## Install

If you are using [npm](https://www.npmjs.com/), to get the last version:

`npm install engine-blackjack`

I'm currently publishing the master branch into NPM until I get the first _tag_.
Ideally, only _tagged commits_ will be uploaded as NPM after that moment.

NOTE: Master branch is under development. Be sure to "ONLY" use tagged version for your production.

## Quick Start

Once obtained the library just _require_ `Game` and `actions`. 

```
const blackjack = require('engine-blackjack')
const actions = blackjack.actions
const Game = blackjack.Game
```

At this point you can initialize a _new game_ by calling the `Game constructor`.

### Creating a new game

```
const game = new Game()
```

In this cases, no state is passed to the constructor: 

 1. the _default_ state is loaded into _game_
 2. _game_ is ready to _`dispatch` actions_ to alter the state

### Getting current state

At any moment we can require the current state of the _game_ by calling the `getState()`.

```
console.dir(game.getState())
```

The content of the state and its _schema_ depends on the _stage_ of the game. In this case
we initialized the game without any precedent state, so we will receive something like this:

```
{
  hits: 0,
  stage: 'ready',
  deck: [
    { text: '9', suite: 'clubs', value: 9 },
    { text: '7', suite: 'clubs', value: 7 },
    ...
    ...
  ],
  handInfo: { left: {}, right: {} },
  history: []
}
```

For the moment the only thing we should note is that the _field_ `stage` tells us "game is ready".

### Dispatching actions

The only way *to mutate the state of the game* is to dispatch actions. Some actions are required by the "user",
some other actions are dispatched by the engine to "complete" the game.

NOTE: In a real game, players and dealer are allowed to "do actions". The engine will "impersonate the dealer" at some point, depending on the _last action_ and the _state_.

```
// stage is "ready"
console.log(game.getState().stage)

// call an action to mutate the state
game.dispatch(actions.deal())

// stage has changed
console.log(game.getState().stage)
```

## Project Structure

### Guidelines that I follow

Inspired by projects done by people I consider smart, like Flux or Redux, 
and motivated by the desire to introduce the functional paradigm in my work day:

 1. platform agnostic (if you can run Node, you are ok. Node can run everywhere)
 2. zero-dependencies (only dev-dependencies)
 3. TDD, break every single game action to be testable
 4. Implement everything that makes sense (and described in [WikipediA](https://en.wikipedia.org/wiki/Blackjack))
 
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
the Free Software Foundation; version 2 of the License.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

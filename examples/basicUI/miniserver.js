const express = require('express')
const app = express()
const session = require('express-session')
const bodyParser = require('body-parser')
const Game = require('../../src/game')
const actions = require('../../src/actions')

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: true
}))

app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'));

app.post('/blackjack/:action', (req, res) => {
  const session = req.session
  const currentStage = session.stage
  const game = new Game(currentStage)
  const { payload = {} } = req.body
  const { action } = req.params
  const fn = actions[ action ]
  if (!fn) {
    return res.send({
      err: `${action} is not a valid action`
    })
  }
  const newStage = game.dispatch(fn(payload))
  if (newStage.stage === 'done') {
    session.stage = null // game completed!
  } else {
    session.stage = newStage
  }
  res.send(Object.assign({}, newStage, {deck: null}))
})

app.listen(3000, () => {
  console.log(`Server running on port 3000!`)
  console.log(`Got to http://localhost:3000/ and play...`)
})

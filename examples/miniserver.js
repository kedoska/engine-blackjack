const express = require('express')
const app = express()
const session = require('express-session')
const bodyParser = require('body-parser')
const Game = require('../src/game')
const actions = require('../src/actions')

app.use(session({ secret: 'Secure Me Please', cookie: { maxAge: 60000 }}))

app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'));

app.post('/blackjack/:action', (req, res) => {
  const session = req.session
  const currentStage = session.stage
  const game = new Game(currentStage)
  const { payload = {} } = req.body
  console.log(req.body)
  const { action } = req.params
  const fn = actions[ action ]
  if (!fn) {
    return res.send({
      err: `${action} is not a valid action`
    })
  }
  const newStage = game.dispatch(fn(payload.position))
  if (newStage.stage === 'done') {
    session.stage = null // game complited!
  } else {
    session.stage = newStage
  }
  res.send(Object.assign({}, newStage, {deck: null}))
})

app.listen(3000, () => {
  console.log(`Server running on port 3000!`)
})

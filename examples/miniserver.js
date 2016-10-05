const app = require('express')()
const session = require('express-session')
const Game = require('../src/game')
const actions = require('../src/actions')

app.use(session({ secret: 'Secure Me Please', cookie: { maxAge: 60000 }}))

app.get('/blackjack/:action', (req, res) => {
  const session = req.session
  const currentStage = session.stage
  const game = new Game(currentStage)
  const { action } = req.params
  const fn = actions[ action ]
  if (!fn) {
    return res.send({
      err: `${action} is not a valid action`
    })
  }
  const newStage = game.dispatch(fn())
  session.stage = newStage
  res.send(Object.assign({}, newStage, {deck: null}))
})

app.listen(3000, () => {
  console.log(`Server running on port 3000!`)
})

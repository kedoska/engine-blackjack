/* global $ */
var dispatch = function (action, position) {
  console.log('dispatching', action)
  hideError()
  $('[data-action]').attr('disabled', 'disabled')
  $.ajax({
    url: '/blackjack/' + action,
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify({
      payload: {
        position: position
      }
    }),
    success: function (data) {
      console.log(data)
      if (data.err) {
        return showError(data.err)
      }

      // Here is because React is sooooo goooood
      $('.hand').empty()

      showCards('dealer', data.dealerCards)
      showCards('player-left', data.handInfo.left.cards)
      showCards('player-right', data.handInfo.right.cards)

      showValues('dealer', data.dealerValue)
      showValues('player-left', data.handInfo.left.playerValue)
      showValues('player-right', data.handInfo.right.playerValue)

      drawHistory(data.history)

      var leftHandInfo = data.handInfo.left.availableActions // only available after split
      var rightHandInfo = data.handInfo.right.availableActions // default position
      enableActions('left', leftHandInfo)
      enableActions('right', rightHandInfo)
      if (data.stage === 'ready' || data.stage === 'done') {
        $('[data-action="deal"]').removeAttr('disabled', 'disabled')
      }
    }
  })
}

var drawHistory = function (data) {
  if (!data) {
    return
  }
  console.log(data)
  var historyTemplate = ''
  historyTemplate += '<li class="li">'
  historyTemplate += '  <div class="timestamp">'
  historyTemplate += '    <span class="author"></span>'
  historyTemplate += '    <span class="date"><span>'
  historyTemplate += '  </div>'
  historyTemplate += '  <div class="status">'
  historyTemplate += '    <h4 class="history-action"></h4>'
  historyTemplate += '  </div>'
  historyTemplate += '</li>'
  var historyContainerElement = $('.timeline')
  historyContainerElement.empty()
  for (var i = 0; i < data.length; i++) {
    if (data[i].type === 'RESTORE') {
      continue
    }
    var historyEl = $(historyTemplate)
    // historyEl.find('.author').text('')
    // historyEl.find('.date').text('')
    historyEl.find('.history-action').text(data[i].type)
    historyEl.appendTo(historyContainerElement)
  }
}

var showCards = function (sector, data) {
  if (!data) {
    return
  }
  var cardTemplate = '<div class="card"><p></p></div>'
  var containerElement = $('[data-card-sector="' + sector + '"]')
  containerElement.empty()
  for (var i = 0; i < data.length; i++) {
    var cardEl = $(cardTemplate)
    cardEl.addClass('suit' + data[i].suite)
    cardEl.find('p').text(data[i].text)
    cardEl.appendTo(containerElement)
  }
}

var showValues = function (sector, value) {
  $('[data-card-value="' + sector + '"]').text(value || '0')
}

var hideError = function () {
  $('.panel-danger').addClass('hide')
}

var showError = function (err) {
  $('.panel-danger').removeClass('hide')
  $('.panel-danger .panel-body').text(err.toString())
}

var enableActions = function (position, data) {
  if (!data) {
    return
  }
  for (var actionName in data) {
    var actionElement = $('[data-position="' + position + '"][data-action="' + actionName + '"]', '[data-hand-position="' + position + '"]')
    if (data[actionName]) {
      actionElement.removeAttr('disabled')
    } else {
      actionElement.attr('disabled', 'disabled')
    }
  }
}

var initializeUI = function () {
  $('[data-action]').click(function (e) {
    var el = $(e.currentTarget)
    var actionName = el.data('action')
    var actionPosition = el.data('position')
    dispatch(actionName, actionPosition)
  })
}

var initializeKeyBind = function () {
  $('body').keypress(function(e) {
    if(e.keyCode === 32) {
      e.preventDefault();
      dispatch('deal', '')
    }
  })
}

$(document).ready(function () {
  initializeUI()
  initializeKeyBind()
  dispatch('restore')
})

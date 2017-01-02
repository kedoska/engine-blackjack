module.exports.luckyLucky = (flatCards, suited, value) => {
  const key = `${flatCards}${suited ? 's': ''}`
  if (key === '777s') {
    return 200
  }
  if (key === '678s') {
    return 100
  }
  if (key === '777') {
    return 50
  }
  if (key === '678') {
    return 30
  }
  if ((value.hi === 21 || value.lo === 21) && suited) {
    return 10
  }
  if ((value.hi === 21 || value.lo === 21) && !suited) {
    return 3
  }
  if ((value.hi === 20 || value.lo === 20)) {
    return 3
  }
  if (value.hi === 19 || value.lo === 19)  {
    return 2
  }
  return 0
}
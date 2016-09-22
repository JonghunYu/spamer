var fs = require('fs')
var _ = require('lodash')
var Promise = require('bluebird')
var request = Promise.promisifyAll(require('request'))
request.getAsync('https://remoteok.io/remote-dev-jobs.json')
.then((response) => {
  return extractEmail(response.body)
}).filter((d) => d)
.then((addresses) => {
  return console.log(addresses)
}).then(() => request.getAsync('https://remoteok.io/remote-mobile-jobs.json'))
.then((response) => {
  return extractEmail(response.body)
}).filter((d) => d)
.then((addresses) => {
  return console.log(addresses)
})

function extractEmail(data) {
  data = JSON.parse(data)
  var linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/g
  var list = []
  return Promise.map(data, (post) => {
    var description = unescape(post.description)
    let res = getEmail(description)
    if (res) {
      return res
    }
    let link = linkRegex.exec(description)
    if (!link) {
      return null
    }
    return request.getAsync(link[1])
      .then((response) => getEmail(response.body))
  })
}

function getEmail(string) {
  var emailRegex = /[\w\d._-]+@[\w\d._-]+\.[\w\d._-]+/g
  var res = emailRegex.exec(string)
  if (res) {
    res = res[0]
    if (res.slice(-1) === ".") {
      res = res.slice(0, -1)
    }
  }
  return res
}

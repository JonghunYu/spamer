var fs = require('fs')
var _ = require('lodash')
var Promise = require('bluebird')
var request = Promise.promisifyAll(require('request'))
request.getAsync('https://remoteok.io/remote-dev-jobs.json')
.then((response) => {
  return extractEmail(response.body)
}).then((addresses) => {
  return console.log(addresses)
}).then(() => request.getAsync('https://remoteok.io/remote-mobile-jobs.json'))
.then((response) => {
  return extractEmail(response.body)
}).then((addresses) => {
  return console.log(addresses)
})

//fs.readFile('./remote-dev-jobs.json', extractEmail)
//fs.readFile('./remote-mobile-jobs.json', extractEmail)
//
function extractEmail(data) {
  data = JSON.parse(data)
  var emailRegex = /[\w\d._-]+@[\w\d._-]+\.[\w\d._-]+/g
  var linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/g
  var list = []
  _.each(data, (item) => {
    var description = unescape(item.description)
    let res = linkRegex.exec(description)
    console.log(res)
    //let res = emailRegex.exec(description)
    //if (res) {
    //  let addr = res[0]
    //  if (addr.slice(-1) === ".") {
    //    addr = addr.slice(0, -1)
    //  }
    //  list.push(addr)
    //} else {
    //}
  })
  return list
}

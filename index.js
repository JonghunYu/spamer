"use strict";
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36";
var fs        = require('fs');
var email     = fs.readFileSync('email.html');
var _         = require('lodash');
var Promise   = require('bluebird');
var request   = Promise.promisifyAll(
  require('request')
  .defaults({ headers: {'User-Agent': USER_AGENT} })
);
var mailer    = require('nodemailer');
var Store     = require("jfs");
var db        = new Store("data", { pretty: true });
var sentList  = db.getSync("sent") || [];

// email setting
var smtpConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: process.env.GMAIL_ACCOUNT,
      pass: process.env.GMAIL_PASSWORD
    }
};
var transporter = Promise.promisifyAll(mailer.createTransport(smtpConfig));
var mailOptions = {
  from: '"Jonghun Yu" <jonghun.yu@nerdyfactory.com>', // sender address
  to: '', // list of receivers
  subject: 'Hi I\'m Jonghun Yu from nerdyfactory', // Subject line
  html: email
};

var list = [];

// get dev jobs
request.getAsync('https://remoteok.io/remote-dev-jobs.json')
.then((response) => extractEmail(response.body))
.then((addresses) => list = list.concat(addresses))

// get mobile jobs
.then(() => request.getAsync('https://remoteok.io/remote-mobile-jobs.json'))
.then((response) => extractEmail(response.body))

// send email except addresses sent already
.then((addresses) => {
  return _.chain(list.concat(addresses))
    .compact()
    .uniq()
    .difference(sentList)
    .value();
}).map((address) => sendEmail(address), {concurrency: 1})

// update sent list
.then((list) => {
  console.log(list);
  return db.saveSync("sent", _.union(list, sentList));
}).catch(e => console.log(e));


function extractEmail(data) {
  data = JSON.parse(data);
  var linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/g;
  var list = [];
  return Promise.map(data, (post) => {
    var description = unescape(post.description);
    let res = getEmail(description);
    if (res) {
      return res;
    }
    let link = linkRegex.exec(description);
    if (!link) {
      return null;
    }
    return request.getAsync(link[1])
      .then((response) => getEmail(response.body));
  }, {concurrency: 4});
}

function getEmail(string) {
  var emailRegex = /[\w\d._-]+@[\w\d._-]+\.[\w\d._-]+/g;
  var res = emailRegex.exec(string);
  if (res) {
    res = res[0];
    if (res.slice(-1) === ".") {
      res = res.slice(0, -1);
    }
  }
  return res;
}

function sendEmail(address) {
  mailOptions.to = address;
  return transporter.sendMailAsync(mailOptions)
    .then((info, error) => {
      if (error) {
        console.log(error);
        return null;
      }
      console.log('Message sent: ', address, info.response);
      return address;
    });
}

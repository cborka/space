var express = require('express');
var router = express.Router();
var md5 = require('crypto-md5/md5');
var db = require("../db");

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('users...!!+zzzzzzzzzzzzzzwwwzzzzzz');
});


//
// Показать список пользователей
//
router.get('/all', function(req, res, next) {
  db.any("SELECT id, login, fullname FROM users ORDER BY 2")
      .then(function (data) {
        res.send({data: data});
      })
      .catch(function (error) {
        res.send(error);
      });
});




module.exports = router;

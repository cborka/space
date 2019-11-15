var express = require('express');
var router = express.Router();
var md5 = require('crypto-md5/md5');
var db = require("../db");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});













module.exports = router;

var express = require('express');
var router = express.Router();

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

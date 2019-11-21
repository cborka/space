var express = require('express');
var router = express.Router();
var db = require("../db");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/get_table_list', function(req, res, next) {
    db.any(
        "SELECT table_rf, item_name AS table_name, t_label, t_info" +
        " FROM table_s t LEFT JOIN item_list i ON t.table_rf = i.item_id" +
        " ORDER BY 2")
        .then (function (data) {

            let data2 = {};
            data2.status = 1;
            data2.data = data;

            res.send(data2);
        })
        .catch(function (error) {
            let data2 = {};
            data2.status = 0;
            data2.errorCode = error.code;
            data2.errorMessage = "Error: /get_table_list: "+error;
//            res.send("ОШИБКА /get_tables: "+error);
            res.send(data2);
        });
});

router.get('/get_table_list2', function(req, res, next) {
    db.any(
        "SELECT table_rf, item_name AS table_name, t_label, t_info" +
        " FROM table_sxxx t LEFT JOIN item_list i ON t.table_rf = i.item_id" +
        " ORDER BY 2")
        .then (function (data) {

            let data2 = {};
            data2.status = 1;
            data2.data = data;

            res.send(data2);
        })
        .catch(function (error) {
            let data2 = {};
            data2.status = 0;
            data2.errorCode = error.code;
            data2.errorMessage = "Error: /get_table_list: "+error;
//            res.send("ОШИБКА /get_tables: "+error);
            res.send(data2);
        });
});












module.exports = router;

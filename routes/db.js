var express = require('express');
var router = express.Router();
var md5 = require('crypto-md5/md5');
var db = require("../db");

router.get('/get_table_info/:table_name', function (req, res, next) {
    db.any(
        "SELECT table_rf, i.item_name AS table_name, t_label, t_info" +
        " FROM table_s t LEFT JOIN item_list i ON t.table_rf = i.item_id" +
        ' WHERE i.item_name = $1 ' +
        " ORDER BY 2", [req.params.table_name]
    )
        .then(function (data) {

            let data2 = {};
            data2.resultCode = 0;
            data2.data = data;

            res.send(data2);
        })
        .catch(function (error) {
            let data2 = {};
            data2.resultCode = 1;
            data2.errorCode = error.code;
            data2.errorMessage = "Error: /get_table_info: " + error;
//            res.send("ОШИБКА /get_tables: "+error);
            res.send(data2);
        });
});


router.get('/get_table_fields/:table_name', function (req, res, next) {
    db.any(
        "SELECT table_rf, f_no, f_name, f_label, f_camel, f_type_rf, t.item_name AS f_type_name, f_length, f_prec, " +
        "       f_null, f_indexes, f_spr_rf, s.item_name AS f_spr_name, f_group_rf, g.item_name AS f_group_name, f_params, f_default, f_info " +
        "  FROM ((((table_f f " +
        "    LEFT JOIN item_list i ON f.table_rf = i.item_id)" +
        "    LEFT JOIN item_list t ON f.f_type_rf = t.item_id)" +
        "    LEFT JOIN item_list s ON f.f_spr_rf = s.item_id)" +
        "    LEFT JOIN item_list g ON f.f_group_rf = g.item_id)" +
        "  WHERE i.item_name = $1 " +
        "  ORDER BY f_no", [req.params.table_name]
    )
        .then(function (data) {

            let data2 = {};
            data2.resultCode = 0;
            data2.data = data;

            return (data2);
        })
        .then(function (data2) {
            data2.xssxx = 'xssxx'; // Просто тест
            res.send(data2);
        })
        .catch(function (error) {
            let data2 = {};
            data2.resultCode = 1;
            data2.errorCode = error.code;
            data2.errorMessage = "Error: /get_table_fields: " + error;
//            res.send("ОШИБКА /get_tables: "+error);
            res.send(data2);
        });
});


module.exports = router;

var express = require('express');
var router = express.Router();
var md5 = require('crypto-md5/md5');
var db = require("../db");

// Возвратить описание таблицы
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

// Список полей таблицы
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


//
// Любая таблица БД, показать
//
router.get('/get_all_table_data/:table_name', function (req, res, next) {

    let data2 = {};

    let table = {t_rf: 0, t_name: req.params.table_name, t_label: '', t_info: ''};

    let t_rf = 0;
    let t_name = req.params.table_name;
    let t_label = '';
    let t_info = '';

    db.one(
        'SELECT item_id FROM item_list WHERE item_name = $1 AND spr_rf = 1147 ', [t_name]
    )
        .then(function (data) {
            t_rf = data.item_id;
            table.t_rf = t_rf;

            return db.one(
                'SELECT t_label, t_info FROM table_s WHERE table_rf = $1 ', [t_rf]
            );
        })
        .then(function (data) {
            t_label = data.t_label;
            t_info = data.t_info;
            table.t_label = t_label;
            table.t_info = t_info;

            return db.any(
                "SELECT f_no, f_name, f_label, f_type_rf, t.item_name AS f_type_name, f_length, f_prec, " +
                "       f_null, f_indexes, f_spr_rf, s.item_name AS f_spr_name, f_group_rf, g.item_name AS f_group_name, f_params, f_default, f_info " +
                "  FROM (((table_f f " +
                "    LEFT JOIN item_list t ON f.f_type_rf = t.item_id)" +
                "    LEFT JOIN item_list s ON f.f_spr_rf = s.item_id)" +
                "    LEFT JOIN item_list g ON f.f_group_rf = g.item_id)" +
                "  WHERE table_rf = $1 " +
                "  ORDER BY f_no", [t_rf]
            );
        })
        .then(function (data) {
            data2.table = table;
            data2.fields = data;

            let sel = get_sel(data2);

            if (sel.substr(0, 6) === 'ОШИБКА') {
                res.send(sel);
                return;
            }

            return db.any(sel);
        })
        .then(function (data) {
            data2.tableData = data;

            console.log(data2);
            res.send(data2);
        })
        .catch(function (error) {
            let data2 = {};
            data2.resultCode = 1;
            data2.errorCode = error.code;
            data2.errorMessage = "Error: /get_all_table_data: " + error;
            res.send(data2);
        });
});


//
// Формирование SELECT
// получение параметров полей таблицы
//
function get_sel(data2) {

    let sql_select = 'SELECT ';
    let rf = '';
    let sk = '';
    let lj = '';
    let f_names = [];
    let f_types = [];
    let f_labels = [];
    let digits10 = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let f_sprs = [];
    let f_spr_names = [];
    let f_groups = [];
    let f_length = [];
    let r_length = 0;
    let f_prec = [];

    let t_pk_f = [];    // Поля первичного ключа
    let t_pk_fn = [];   // Номера полей первичного ключа как они показаны в таблице на экране
    let t_u_f = [[]];   // Уникальные индексы
    let t_u_fn = [[]];  // Уникальные индексы
    let t_d_f = [[]];   // Индексы
    let t_d_fn = [[]];  // Индексы

    let data = data2.fields;

    // Цикл по полям таблицы
    for (let i = 0; i < data.length; i++) {

        sql_select = sql_select + ' t.' + data[i].f_name;

        data[i].f_length = (data[i].f_length === 0) ? 80 : data[i].f_length;
        data[i].f_length = (data[i].f_length < 20) ? 20 : data[i].f_length;

        // Формирование массивов свойств полей таблицы
        f_names.push(data[i].f_name);
        f_types.push(data[i].f_type_name);
        f_labels.push(data[i].f_label);
        f_sprs.push(data[i].f_spr_rf);
        f_spr_names.push('');
        f_groups.push(data[i].f_group_rf);
        f_length.push(data[i].f_length);
        f_prec.push(data[i].f_prec);

        r_length += data[i].f_length;


        // ВАЖНО!!!
        // Количество полей таблицы на экране больше количества полей таблицы БД,
        // потому что к каждому полю-ссылке (.._rf) добавляется поле-название (.._name)
        // Например:
        // Таблица БД:        table_rf,                          t_label, t_info
        // Таблица на экране: table_rf, item_name AS table_name, t_label, t_info


        // Поле data[i].f_indexes описывает в какие индексы входит данное поле
        // Имеет вид p11,u21,d32
        // первая буква - p - primary key, u - unique, d - индекс с повторяющимися значаниями
        // первая цифра - номер индекса,
        // вторая цифра - номер поля в индексе
        if (data[i].f_indexes !== '') {
//            let i_arr = [];
            let i_arr = data[i].f_indexes.split(',');  //  i_arr = ['p11','u21','d32']

            for (let k = 0; k < i_arr.length; k++) {
                let if_arr = i_arr[k].split('');   //  if_arr = ['p', '1', '1']

                if (i_arr[k].length !== 3) {
                    sql_select = 'ОШИБКА: Неверное значение в поле Индексы, неверное описание: "' + data[i].f_indexes + '"';
                    return sql_select;
                }
                if (digits10.indexOf(if_arr[1]) === -1) {
                    sql_select = 'ОШИБКА: Неверное значение в поле Индексы, неверный номер индекса: "' + data[i].f_indexes + '"';
                    return sql_select;
                }
                if (digits10.indexOf(if_arr[2]) === -1) {
                    sql_select = 'ОШИБКА: Неверное значение в поле Индексы, неверный номер поля индекса: "' + data[i].f_indexes + '"';
                    return sql_select;
                }

                if (if_arr[0] === 'p') {  // primary key
                    t_pk_f[+if_arr[2] - 1] = data[i].f_name;      // Имя поля
                    t_pk_fn[+if_arr[2] - 1] = f_names.length - 1; // Номер поля первичного ключа. Это не i, потому что к полям .._rf добавляются поля .._name
                } else if (if_arr[0] === 'u') {  // unique index
                    t_u_f[+if_arr[1]][+if_arr[2]] = data[i].f_name;
                    t_u_fn[+if_arr[1]][+if_arr[2]] = f_names.length - 1;
                } else if (if_arr[0] === 'd') {  // index
                    t_d_f[+if_arr[1]][+if_arr[2]] = data[i].f_name;
                    t_d_fn[+if_arr[1]][+if_arr[2]] = f_names.length - 1;
                } else {
                    sql_select = 'ОШИБКА: Неверное значение в поле Индексы, неверный тип индекса: "' + data[i].f_indexes + '"';
                    return sql_select;
                }
            }
        } // Закончили формирование индексов

        // Поля-ссылки
        rf = data[i].f_name.slice(-3);
        // Если поле-ссылка, то добавляем поле-название (расшифровку ссылки)
        if (rf === '_rf') {
            sql_select = sql_select + ', s' + i + '.item_name AS ' + data[i].f_name.slice(0, -2) + 'name';
            sk = sk + '(';
            lj = lj + ' LEFT JOIN item_list s' + i + ' ON t.' + data[i].f_name + ' = s' + i + '.item_id) ';

            f_names.push(data[i].f_name.slice(0, -2) + 'name');
            f_types.push('VARCHAR');
            f_labels.push(data[i].f_label);

            f_sprs.push(data[i].f_spr_rf);
            f_spr_names.push(data[i].f_spr_name);
            f_groups.push(data[i].f_group_rf);

            f_length.push(data[i].f_length);
            f_prec.push(data[i].f_prec);

            // Ширина для кода из справочника, вообще-то код это предыдущее поле, но тут находим сумму и порядок суммирования может быть любым
            r_length += 20;
        }

        if (i !== data.length - 1)
            sql_select = sql_select + ',';
    }

    data2.t_name = data2.table.t_name;
    data2.f_names = f_names;
    data2.f_types = f_types;
    data2.f_labels = f_labels;
    data2.f_sprs = f_sprs;
    data2.f_spr_names = f_spr_names;
    data2.f_groups = f_groups;
    data2.t_pk_f = t_pk_f;
    data2.t_pk_fn = t_pk_fn;
    data2.t_u_f = t_u_f;
    data2.t_u_fn = t_u_fn;
    data2.t_d_f = t_d_f;
    data2.t_d_fn = t_d_fn;
    data2.r_length = r_length;
    data2.f_length = f_length;
    data2.f_prec = f_prec;

    sql_select = sql_select + ' FROM ' + sk + data2.table.t_name + ' t ' + lj + ' ORDER BY 1, 2, 3';
    return sql_select;
}

// camelCase and it`s tests
function toCamelCase(str) {
    let cC = '';

    for (let i = 0; i < str.length; i++) {
        if (str[i] === '_' && i < str.length-1 && str[i+1] !== '_' ) {
            cC += str[++i].toUpperCase();
        } else {
            cC += str[i].toLowerCase();
        }
    }
    return cC;
}

function fromCamelCase(str) {
    let cc = '';

    for (let i = 0; i < str.length; i++) {
        if (str[i] === str[i].toUpperCase()  && str[i] !== '_') {
            cc += '_'+str[i].toLowerCase();
        } else {
            cc += str[i];
        }
    }
    return cc;
}

router.get('/to_cc/:str', function (req, res, next) {
    res.send(toCamelCase(req.params.str));
});

router.get('/from_cc/:str', function (req, res, next) {
    res.send(fromCamelCase(req.params.str));
});


module.exports = router;

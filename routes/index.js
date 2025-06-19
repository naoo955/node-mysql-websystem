const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const knex = require('../db/knex');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'todo_app'
});

//let todos = [];

router.get('/', function (req, res, next) {
  knex("tasks")
    .select("*")
    .then(function (results) {
      console.log(results);
      res.render('index', {
        title: 'ToDo App',
        todos: results,
      });
    })
    .catch(function (err) {
      console.error(err);
      res.render('index', {
        title: 'ToDo App',
      });
    });
});

router.post('/', function (req, res, next) {
  connection.connect((err) => {
    if (err) {
      console.log('error connecting: ' + err.stack);
      return
    }
    console.log('success');
  });
  const todo = req.body.add;
  connection.query(
  `insert into tasks (user_id, content) values (1, '${todo}');`,
  (error, results) => {
    console.log(error);
    res.redirect('/');
  }
);
});

module.exports = router;
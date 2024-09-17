var express = require('express');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;

var ensureLoggedIn = ensureLogIn();


const todos = [];


const users = []; 

function fetchdo(req, res, next) {
  
  const userdo = todos.filter(todo => todo.owner_id === req.user.id);
  
  
  const mappeddo = userdo.map(todo => ({
    id: todo.id,
    title: todo.title,
    completed: todo.completed === 1,
    url: '/' + todo.id
  }));
  
  res.locals.todos = mappeddo;
  res.locals.activeCount = mappeddo.filter(todo => !todo.completed).length;
  res.locals.completedCount = mappeddo.length - res.locals.activeCount;
  next();
}

var router = express.Router();


router.get('/', function(req, res, next) {
  if (!req.user) { return res.render('home'); }
  next();
}, fetchdo, function(req, res, next) {
  res.locals.filter = null;
  res.render('index', { user: req.user });
});

router.get('/active', ensureLoggedIn, fetchdo, function(req, res, next) {
  res.locals.todos = res.locals.todos.filter(todo => !todo.completed);
  res.locals.filter = 'active';
  res.render('index', { user: req.user });
});

router.get('/completed', ensureLoggedIn, fetchdo, function(req, res, next) {
  res.locals.todos = res.locals.todos.filter(todo => todo.completed);
  res.locals.filter = 'completed';
  res.render('index', { user: req.user });
});

router.post('/', ensureLoggedIn, function(req, res, next) {
  req.body.title = req.body.title.trim();
  next();
}, function(req, res, next) {
  if (req.body.title !== '') { return next(); }
  return res.redirect('/' + (req.body.filter || ''));
}, function(req, res, next) {
  const newTodo = {
    id: todos.length + 1, 
    owner_id: req.user.id,
    title: req.body.title,
    completed: req.body.completed ? 1 : 0
  };
  todos.push(newTodo);
  return res.redirect('/' + (req.body.filter || ''));
});

router.post('/:id(\\d+)', ensureLoggedIn, function(req, res, next) {
  req.body.title = req.body.title.trim();
  next();
}, function(req, res, next) {
  if (req.body.title !== '') { return next(); }
  const index = todos.findIndex(todo => todo.id == req.params.id && todo.owner_id === req.user.id);
  if (index !== -1) {
    todos.splice(index, 1);
  }
  return res.redirect('/' + (req.body.filter || ''));
}, function(req, res, next) {
  const todo = todos.find(todo => todo.id == req.params.id && todo.owner_id === req.user.id);
  if (todo) {
    todo.title = req.body.title;
    todo.completed = req.body.completed !== undefined ? 1 : 0;
  }
  return res.redirect('/' + (req.body.filter || ''));
});

router.post('/:id(\\d+)/delete', ensureLoggedIn, function(req, res, next) {
  const index = todos.findIndex(todo => todo.id == req.params.id && todo.owner_id === req.user.id);
  if (index !== -1) {
    todos.splice(index, 1);
  }
  return res.redirect('/' + (req.body.filter || ''));
});

router.post('/toggle-all', ensureLoggedIn, function(req, res, next) {
  todos.forEach(todo => {
    if (todo.owner_id === req.user.id) {
      todo.completed = req.body.completed !== undefined ? 1 : 0;
    }
  });
  return res.redirect('/' + (req.body.filter || ''));
});

router.post('/clear-completed', ensureLoggedIn, function(req, res, next) {
  const index = todos.findIndex(todo => todo.owner_id === req.user.id && todo.completed === 1);
  if (index !== -1) {
    todos.splice(index, 1);
  }
  return res.redirect('/' + (req.body.filter || ''));
});

module.exports = router;

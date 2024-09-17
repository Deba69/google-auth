var express = require('express');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oidc');
var bcrypt = require('bcrypt');

// to store users
const users = [];

// Configure the Google strategy for use by Passport.
passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: 'http://localhost:8000/oauth2/redirect/google',
  scope: [ 'profile' ]
}, function verify(issuer, profile, cb) {
  // Find user based on the Google ID
  const user = users.find(u => u.provider === issuer && u.subject === profile.id);

  if (!user) {
    // If user doesn't exist, create a new one
    const newUser = {
      id: users.length + 1,
      name: profile.displayName,
      provider: issuer,
      subject: profile.id
    };
    users.push(newUser);
    return cb(null, newUser);
  } else {
    // User exists, return the user
    return cb(null, user);
  }
}));

// Configure Passport authenticated session persistence.
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

var router = express.Router();

/* GET /login
 *
 * This route prompts the user to log in.
 */
router.get('/login', function(req, res, next) {
  res.render('login');
});


router.get('/login/federated/google', passport.authenticate('google'));


router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/login'
}));


router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


router.post('/register', async function(req, res, next) {
  const { username, password } = req.body;
  
  
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).send('User already exists');
  }
  
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  
  const newUser = {
    id: users.length + 1,
    username,
    hashedPassword
  };
  users.push(newUser);
  
  res.status(201).send('User registered');
});

router.post('/login', async function(req, res, next) {
  const { username, password } = req.body;
  
  // Find user by username
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(400).send('Invalid username or password');
  }
  
  // Check the password
  const match = await bcrypt.compare(password, user.hashedPassword);
  if (!match) {
    return res.status(400).send('Invalid username or password');
  }
  
  req.login(user, function(err) {
    if (err) { return next(err); }
    res.status(200).send('Logged in');
  });
});

module.exports = router;

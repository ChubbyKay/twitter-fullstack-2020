if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const exphbs = require('express-handlebars')
const db = require('./models')
const Message = db.Message
const User = db.User
const session = require('express-session')
const flash = require('connect-flash')
const app = express()
const PORT = process.env.PORT || 3000

const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const passport = require('./config/passport')
const path = require('path')
const Handlebars = require('handlebars')
const helpers = require('./_helpers')
const socket = require('socket.io')
const moment = require('moment')

// This package can help you disable prototype checks for your models.
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access')

app.use(express.static('public'))

app.use('/upload', express.static(__dirname + '/upload'))

app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: require('./config/handlebars-helpers'),  // add partial
  handlebars: allowInsecurePrototypeAccess(Handlebars)
}))

app.set('view engine', 'hbs')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(methodOverride('_method'))

let loginID

app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success_messages')
  res.locals.error_messages = req.flash('error_messages')
  res.locals.user = helpers.getUser(req)

  if (helpers.getUser(req)) {
    loginID = helpers.getUser(req).id
  }

  next()
})


const server = app.listen(PORT, () => console.log(`Express is listening on http://localhost:${PORT}`))
const io = socket(server)

io.on('connection', async socket => {
  console.log('a user connected!');

  // get history message
  let historyMessages
  await Message.findAll({
    include: [User],
    order: [['createdAt', 'ASC']]
  }).then(messages => {
    historyMessages = messages.map(item => ({
      text: item.dataValues.text,
      name: item.dataValues.User.name,
      avatar: item.dataValues.User.avatar,
      isLoginUser: loginID === item.dataValues.User.id ? true : false,
      time: moment(item.dataValues.createdAt).format('LLL')
    }))
  })

  // emit history message to user
  socket.emit('history', historyMessages)

  socket.on('message', data => {
    console.log('Get message')
    // socket.broadcast.emit('chat', 'A join chat room')
    io.emit("chat", 'A join chat room');
    io.emit("message", data);
  })

  socket.on('disconnect', function () {
    console.log('a user go out');
  })

  socket.on("message", data => {
    console.log('send message')
    io.emit("message", 'data');
  });
})


require('./routes')(app, passport)

module.exports = app
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
const errorController = require('./controllers/error');
const csurf = require('csurf')
const flash = require('connect-flash')
const  multer = require('multer')
const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const User = require('./models/user')

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop')
const authRoutes = require('./routes/auth')

const store = MongoDBStore({
  uri : 'mongodb+srv://Alfajri:desember31@cluster0.9xfnm.mongodb.net/shop',
  collection: 'mySessions'
})


const fileStorage = multer.diskStorage({
  destination : (req,file,cb) => {
    cb(null,'images')
  },
  filename : (req,file,cb) => {
    cb(null,new Date().toISOString().slice(0, 10)+'-'+file.originalname)
  }
})

const filefilter = (req,file,cb) => {

  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null,true)
  } else {
    cb(null,false)
  }
} 

// app.use(multer({dest: 'images'}).single('image'))
app.use(multer({storage: fileStorage, fileFilter: filefilter}).single('image'))

app.use(bodyParser.urlencoded({ extended: false ,useNewUrlParser: true}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));

const csrfProtection = csurf();

app.use(session({secret: 'my secret',resave: false, saveUninitialized: false, store:store}))


app.use(flash())
app.use(csrfProtection)


app.use((req,res,next) => {
  res.locals.csrfToken = req.csrfToken()
  res.locals.hasLogin = req.session.IsLoggedIn
  next();
})


app.use((req,res,next) => {
  if(!req.session.user) {
    return next()
  }
  User.findById(req.session.user)
  .then(user => {
    req.user = user
    next()
  })
  .catch(err => console.log(err));

})

app.use('/admin', adminRoutes);

app.use(authRoutes);

app.use(shopRoutes);

app.use(errorController.get500);

app.use((error,req,res,next) => {
  console.log(error)
  res.redirect('/500')
})

app.use(errorController.get404);

mongoose
  .connect(
    'mongodb+srv://Alfajri:desember31@cluster0.9xfnm.mongodb.net/shop'
  )
  .then(result => {
    app.listen(3000);
    // let user = User.findOne().then(result => {
    //   if(!result) {
    //     user = new User({
    //       password : 'fajri',
    //       email: 'fajri@test.com'
    //     })
    //     user.save()
    //   }
    // }) 
  })
  .catch(err => {

    console.log(err);
    return next(new err)
  });

  exports.session = session


  /**
 * mechanism ~
 * 
 * since you add req.session.IsLoggedIn you dont need add isAuthenticated: req.session.isLoggedIn in every controller get and post
 * since you add session the initialize for locals property is using session databse property
 * the flow middleware is : 1. request , 2. server, 3. response 4. browser/client as long there is no response the request will always looping till get feedback of response 
 * the sort of  middlware just remember when you app is crash what next middlware will handle
 * for showing image into the applcation you need to write '/' means left of '/' is your website name and right of '/' is everything path of your webiste so 
 *      - when it first write by '/' and then 'product'so it will transformed into "mywebisite.com/product" to serve that request into static file path you need
 *      - need somehthing like this 'app.use(express.static(path.join(__dirname, <your_path_for_static>))); it will refer to the app.js first then your  <your_path_for_static>
 *       - static means your folder worked will be access public in the website 
 */
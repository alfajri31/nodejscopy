const User = require('../models/user');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator')

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    error: req.flash('error'),
    isAuthenticated: false,
    oldInput: {email: '', password: ''},
    validationErrors : []
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    error: req.flash('error-signup'),
    isAuthenticated: false,
    oldInput: {email: '',password: ''},
    validationErrors : []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password

  
  User.findOne({email:email}).then((user) => {
    if(user == null) {
      req.flash('error','There is no email/username')
      res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        error: req.flash('error'),
        isAuthenticated: false,
        oldInput: {email: req.body.email , password: req.body.password},
        validationErrors : [{param:'email'}]
      });
    }
    if(user) { 
      bcrypt.compare(password,user.password).then((result) => {
        if(result) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          req.session.save(err => {
            console.log(err);
            return res.redirect('/');
          });
        } 
        if(!result) {
          req.flash('error','Invalid email or password')
          res.render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            error: req.flash('error'),
            isAuthenticated: false,
            validationErrors : [{param:'email'},{param:'password'}],
            oldInput: {email: req.body.email , password: req.body.password}
          });
        }
      })
    }
  })
};


exports.postSignup = (req, res, next) => {

  const email = req.body.email
  const password = req.body.password
  const error = validationResult(req)
  // console.log(error.errors[0].msg) // =>invalid value

  if(!error.isEmpty()) {
    console.log(error.errors)
       return res.status(422).render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        error: error.errors,
        isAuthenticated: false,
        oldInput: {email: req.body.email,password: req.body.password},
        validationErrors : error.errors
      });
    }
  
  // if(password == '' || email == '') {
  //  return res.render('auth/signup', {
  //     path: '/signup',
  //     pageTitle: 'Signup',
  //     error: error,
  //     isAuthenticated: false
  //   });
  // }
  

  User.findOne({email:email}).then( result => {
     
    if(result) {

      req.flash('error-signup','email has already been taken')
      res.redirect('/signup')
      
    } 
    else {

    return bcrypt.hash(passwor,12).then((password) => {
      const user = new User({
        email: email,
        password: password
      })

      
      user.save();

      const SibApiV3Sdk = require('sib-api-v3-sdk');
      let defaultClient = SibApiV3Sdk.ApiClient.instance;
      
      let apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = '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';
      
      let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      
      let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = "[WELCOME NEW USER] from nodecomplete";
      sendSmtpEmail.htmlContent = `<html><body><h1>please free to http://localhost:3000</h1></body></html>`;
      sendSmtpEmail.sender = {"name":"John Doe","email":"alfajri3112@gmail.com"};
      sendSmtpEmail.to = [{"email":req.body.email,"name":"Jane Doe"}];
      sendSmtpEmail.bcc = [{"name":"John Doe","email":"alfajri3112@gmail.com"}];
      sendSmtpEmail.replyTo = {"email":"replyto@domain.com","name":"John Doe"};
      sendSmtpEmail.headers = {"Some-Custom-Name":"unique-id-1234"};
      sendSmtpEmail.params = {"parameter":"My param value","subject":"New Subject"};
      
      apiInstance.sendTransacEmail(sendSmtpEmail).then(function(data) {
        console.log('API called successfully sent to user');
      }, function(error) {
        console.error(error);
      });

    
      // const SibApiV3Sdk = require('sib-api-v3-sdk');
      // let defaultClient = SibApiV3Sdk.ApiClient.instance;
      
      // let apiKey = defaultClient.authentications['api-key'];
      // apiKey.apiKey = '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';
      
      // let apiInstance = new SibApiV3Sdk.EmailCampaignsApi();
      
      // let campaignId = 1; 
      
      // let emailTo = new SibApiV3Sdk.SendTestEmail(); 
      
      // emailTo = {
      //   "emailTo":[email]
      // };
      
      // apiInstance.sendTestEmail(campaignId, emailTo).then(function() {
      //   console.log('API called successfully Email has been sent to new user.');
      // }, function(error) {
      //   console.error(error);
      // });

      res.redirect('/login')
    })
  }
  }).catch(err => {
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(error)
    // res.redirect('/500')
  })
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req,res,next) => {
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset password',
    isAuthenticated: false,
    error : req.flash('error-reset')
  })
  .catch(err => console.log(err))
}

exports.postReset = (req,res,next) => {
  User.findOne({email: req.body.email}).then(result => {
    if(result) {
      //change password
      crypto.randomBytes(32,(err,buffer) => {
        if(err) {
      
          res.redirect('/reset')
        }
            const token = buffer.toString('hex')

            User.findOne({email:req.body.email}).then(result => {
             
              if(!result) {
          
                res.redirect('/reset')            
              }
              result.token = token
              result.expireToken = Date.now() + 3600000
              
              return result.save()
            })
            .then(result => {

              const SibApiV3Sdk = require('sib-api-v3-sdk');
              let defaultClient = SibApiV3Sdk.ApiClient.instance;
              
              let apiKey = defaultClient.authentications['api-key'];
              apiKey.apiKey = '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';
              
              let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
              
              let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
              
              sendSmtpEmail.subject = "[RESET PASSWORD] from nodecomplete";
              sendSmtpEmail.htmlContent = `<html><body><h1>this is url for reset password http://localhost:3000/reset/${token}</h1></body></html>`;
              sendSmtpEmail.sender = {"name":"John Doe","email":"alfajri3112@gmail.com"};
              sendSmtpEmail.to = [{"email":req.body.email,"name":"Jane Doe"}];
              sendSmtpEmail.bcc = [{"name":"John Doe","email":"alfajri3112@gmail.com"}];
              sendSmtpEmail.replyTo = {"email":"replyto@domain.com","name":"John Doe"};
              sendSmtpEmail.headers = {"Some-Custom-Name":"unique-id-1234"};
              sendSmtpEmail.params = {"parameter":"My param value","subject":"New Subject"};
              
              apiInstance.sendTransacEmail(sendSmtpEmail).then(function(data) {
                console.log('API called successfully sent to user');
              }, function(error) {
                console.error(error);
              });

              res.redirect('/')

            }).catch(err => console.log(err))
      })
    } else {
      console.log('no email')
      req.flash('error-reset','the email is not registered')
      res.redirect('/reset')
     
    }
  
  })
}

exports.getNewPassword = (req,res,next) => {

  const token = req.params.token

  User.findOne({token: token}).then(result => {
    res.render('auth/new-password', {
      path: '/new-password',
      pageTitle: 'New Password',
      isAuthenticated: false,
      userId : result._id,
      token : result.token,
      error: req.flash('error-new-password')
    })
    .catch(err => {
      console.log(err)
    })
  })

 
}

exports.postNewPassword = (req,res,next) => {
    const userId = req.body.userId
    const token = req.body.token

    User.findOne({expireToken:{$gt:Date.now()}, _id: userId, token:token}).then( result => {
              return bcrypt.hash(req.body.password,12)
    })
    .then(result => {
      req.user.password = result
      req.user.expireToken = undefined
      req.user.token = undefined
      req.user.save()
      res.redirect('/login')
    })
    .catch(err => console.log(err))
}


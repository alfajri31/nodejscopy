const express = require('express');
const authController = require('../controllers/auth');
const { check , body } = require('express-validator')

const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login', authController.postLogin);

router.get('/signup',authController.getSignup);

router.post('/signup', 
[
    check('email').isEmail().withMessage('Email is not valid'),
    body('password').isLength({min:5}).withMessage('Password must at least 5 characters').isAlphanumeric().withMessage('Password must be alphanumeric'),
    body('confirmPassword').custom((value,{req}) => {
        if (value!==req.body.password) {
            throw new Error('Password have to Match')
        }
        return true
        
    })
],authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset)

router.post('/reset', authController.postReset)

router.get('/reset/:token',authController.getNewPassword)

router.post('/new-password',authController.postNewPassword)

module.exports = router;
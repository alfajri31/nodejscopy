const path = require('path');

const express = require('express');
const adminController = require('../controllers/admin');
const { body } = require('express-validator')
const isAuth = require('../middleware/is-auth')
const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', isAuth, [

    body('title').isLength({min:5}).withMessage('title must more than 5 characters').trim(),
    body('price').isNumeric().withMessage('Price must numeric').trim(),
    body('description').isLength({min:5,max:500}).withMessage('description minimal 5 and max 500 characters').trim()

],adminController.postAddProduct);

router.get('/edit-product/:productId',isAuth, adminController.getEditProduct);

router.post('/edit-product', [

    body('title').isLength({min:5}).withMessage('title must more than 5 characters').trim(),
    body('price').isNumeric().withMessage('Price must numeric').trim(),
    body('description').isLength({min:5,max:500}).withMessage('description minimal 5 and max 500 characters').trim()], isAuth, adminController.postEditProduct);

router.delete('/product/:productId',isAuth,adminController.deleteAproduct)


module.exports = router;

const Product = require('../models/product');
const Order = require('../models/order');
const fs = require('fs')
const path = require('path');
const Pdf = require('pdfkit');
const remove = require('./../util/deleteimage')

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      console.log(products);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId._id': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};

exports.getDownloadOrder = (req,res,next) => {
  orderId = req.params.id
  const invoice = 'order-'+orderId+'.pdf'
  const invoicePath = path.join('data','invoices',invoice)


  Order.findById(orderId).then(result => {
    if(result.user.userId._id.toString() == req.user._id.toString()) {
      ////pick one
      // fs.readFile(invoicePath,(err,data) => {
      //   if(err) {
      //     next(err)
      //   }
      //   else {
      //     res.setHeader('Content-Type','application/pdf')
      //     res.setHeader('Content-Disposition','attachment; filename='+invoice)
      //     res.send(data)
      //   }
      // })

      ////pick one
      // const file = fs.createWriteStream(invoicePath)
      // res.setHeader('Content-Type','application/pdf')
      // res.setHeader('Content-Disposition','inline; filename='+invoice)
      // file.pipe(res)

      const pdf = new Pdf();
      res.setHeader('Content-Type','application/pdf')
      res.setHeader('Content-Disposition','inline; filename='+invoice)
      pdf.pipe(fs.createWriteStream(invoicePath))
      pdf.pipe(res)
      pdf.text('test from fajri')
      pdf.fontSize(12).text('this is your invoice id '+result._id)
      pdf.fontSize(12).text('this is your buying:')
      pdf.text('----------------------------------------')
      console.log(result.products)
      result.products.forEach(result => {
        pdf.text('judul buku '+result.product.title)
        pdf.text('harga buku Rp.' +result.product.price+',00')
        pdf.text('jumlah '+result.quantity)
        pdf.text('total harga adalah '+result.product.price * result.quantity)
        pdf.text('--------------------------------------')
      })
      
      pdf.end()
    }
 
    
  }).catch(err => {
    next(new Error('your id is restricted'))
  })

  

  
}

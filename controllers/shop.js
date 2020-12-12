const Product = require('../models/product');
const Order = require('../models/order');
const fs = require('fs')
const path = require('path');
const Pdf = require('pdfkit');
const remove = require('./../util/deleteimage')
const midtransClient = require('midtrans-client');
const product = require('../models/product');
let snap = new midtransClient.Snap()
snap.apiConfig.set({serverKey : 'SB-Mid-server-_TJnxCzHeTmekfNorAyBYPy_'});
const ITEMS_PER_PAGE = 1


exports.getProducts = (req, res, next) => {
  const page =+ req.query.page || 1 // + convert query string to integer dan tanda || 1 karena jika nilainya undefined/false  maka pilih nilai 1
  let totalItems
  // console.log(page)
  Product.find().countDocuments().then(result => {
    totalItems = result
    return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
  })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        isAuthenticated: req.session.isLoggedIn,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      console.log(err);
    });
  ////version 1.0
  // Product.find()
  //   .then(products => {
  //     console.log(products);
  //     res.render('shop/product-list', {
  //       prods: products,
  //       pageTitle: 'All Products',
  //       path: '/products',
  //       isAuthenticated: req.session.isLoggedIn
  //     });
  //   })
  //   .catch(err => {
  //     console.log(err);
  //   });
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
  const page =+ req.query.page || 1  // + convert query string to integer dan tanda || 1 karena jika nilainya undefined/false  maka pilih nilai 1
  let totalItems
  // console.log(page)
  Product.find().countDocuments().then(result => {
    totalItems = result
    return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
  })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        isAuthenticated: req.session.isLoggedIn,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
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
 

  exports.getCheckout = (req,res,next) => {

    let products;
    let total = 0;

    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      let total = 0;
      products.forEach(p=> {
        total += p.quantity * p.productId.price
      })
      
      const line_items = products.map(p => {
        console.log(p.productId)
        return {
          "id": p.productId,
          "price": p.productId.price,
          "quantity": p.quantity,
          "name": p.productId.title,
          "brand": "Fuji Apple",
          "category": "Fruit",
          "merchant_name": "Fruit-store",
          "tenor": "12",
          "code_plan": "000",
          "mid": "123456"
        }
      })
      const transcation_id = Math.floor(Math.random() * 10000);
      snap.createTransaction(
        {
          "transaction_details": 
          {
              "order_id": 'transaction-'+transcation_id,
              "gross_amount": total
          }, 
          "credit_card":
          {
              "secure" : true
          },
          line_items
        }
      )
      .then((transaction)=>{
          // transaction token
          let transactionToken = transaction.token;
          // console.log('transactionToken:',transactionToken);
          return transactionToken
      })
      .then( token => {
        res.render('shop/checkout', {
          path: '/checkout',
          pageTitle: 'Your Checkout',
          products: products,
          isAuthenticated: req.session.isLoggedIn,
          totalSum: total,
          token: token,
        });   
      })
      // res.render('shop/checkout', {
      //   path: '/checkout',
      //   pageTitle: 'Your Checkout',
      //   products: products,
      //   isAuthenticated: req.session.isLoggedIn,
      //   totalSum: total
      // });
    })
    .catch(err => console.log(err));
    
    

   

  }
  

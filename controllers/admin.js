const Product = require('../models/product');
const { validationResult } = require('express-validator')
const remove = require('./../util/deleteimage')

exports.getAddProduct = (req, res, next) => {
  
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: true,
    product: {
      title: '',
      imageUrl : '',
      price: '',
      description: ''
    },
    error: '',
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const error = validationResult(req)
 

  if(!image) /*if undefined*/ {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      error: 'This File Is Not JPEG/PNG/JPG format',
      isAuthenticated: req.session.isLoggedIn
    });
  }
  
  if(!error.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        imageUrl : image,
        price: price,
        description: description
      },
      error: Object.values(error.array()[0])[1],
      isAuthenticated: req.session.isLoggedIn
    });
  }

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: image.path,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
    });


};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        error: '',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};

exports.postEditProduct = (req, res, next) => {

  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  const error = validationResult(req)
  // console.log(error)
  console.log('ini adalah '+prodId)

  Product.findById(prodId)

    .then(product => {
      if(JSON.stringify(product.userId) != JSON.stringify(req.user._id)) {
        return res.redirect('/')
      }
    
      if(!error.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
          pageTitle: 'Edit Product',
          path: '/admin/edit-product',
          editing: true,
          hasError: true,
          product: {
            title: updatedTitle,
            price: updatedImagePrice,
            description: updatedDesc
          },
          error: error.array()[0],
          isAuthenticated: req.session.isLoggedIn
        });
      }

   
      product.price = updatedPrice;
      product.description = updatedDesc;

  
      if(image) {
        remove.deleteImage(product.imageUrl)
        product.imageUrl = image.path;
      }
      // product.imageUrl = updatedImageUrl;
      product.title = updatedTitle;
  

      product.save().then(result => {
      
        console.log('UPDATED PRODUCT!');
        return res.redirect('/admin/products');
      })
    })
    
    .catch(err => console.log(err));
};

exports.getProducts = (req, res, next) => {
  Product.find({userId: req.user._id})
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      console.log(products);
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};

exports.deleteAproduct = (req,res,next) => {

 
  const prodId = req.params.productId;
  console.log('this is my prodId '+prodId)

  Product.findById(prodId).then(result => {
      return remove.deleteImage(result.imageUrl)
  }).catch(err => next(new Error('no found image')))

  Product.deleteOne({_id:prodId,userId:req.user._id})
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.status(200).json({message: "Success!"})
    })
    .catch(err => res.status(500).json({message: "Failed!"}));
}

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;

  Product.findById(prodId).then(result => {
      return remove.deleteImage(result.imageUrl)
  }).catch(err => next(new Error('no found image')))

  Product.deleteOne({_id:prodId,userId:req.user._id})
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};

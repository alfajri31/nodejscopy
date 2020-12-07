const mongoose = require('mongoose')
const Schema = mongoose.Schema

const orderSchema = mongoose.Schema({
    products: [{
        product: {type: Object,required: true},
        quantity: {type: Number, required: true}
    }],
    user: {
        userId : {type: Object, required: true},
        email : {type: String, required: true}
    }
})



module.exports = mongoose.model('Order',orderSchema)


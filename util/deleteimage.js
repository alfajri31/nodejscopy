const fs = require('fs')
const path = require('path')


//not using __dirname has been declade in util/path

const deleteImage = (image) => {
    console.log(image)
    fs.unlink(image,(err,data) => {
        if(err) {
            console.log('image lama berhasil dihapus')
            console.log(err)
        }
        else {
            console.log(data)
        }
    })
}

exports.deleteImage = deleteImage
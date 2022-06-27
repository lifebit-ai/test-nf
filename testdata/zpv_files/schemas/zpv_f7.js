const mongoose = require('mongoose');

const zpv_schema = new mongoose.Schema({
    i: {
        type: String,
        required: true,
        index: true
    },
    f: {
        type: String,
        required: true,
        index: true
    },
    is: {
        type: Number,
        required: true
    },
    a: {
        type: Number
    },
    v: {
        type: String,
        required: true
    }
})
module.exports = mongoose.model('zpv_f7', zpv_schema, 'zpv_f7');
const mongoose = require('mongoose');
// All fields in this schema have to be populated for a document to be ingested (required: true)
const zpv_schema = new mongoose.Schema({
    i: {
        type: String,
        required: true
    },
    data_source: {
        type: String,
        required: true
    },
    f: {
        type: String,
        required: true
    },
    is: {
        type: String,
        required: true
    },
    a: {
        type: String,
        required: true
    },
    v: {
        type: String,
        required: true
    }
})
// The following line is dynamically added within main.nf` to flexibily change according to each zpv collection needs.
// module.exports = mongoose.model('zpv_f1', zpv_schema, 'zpv_f1');

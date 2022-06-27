const mongoose = require('mongoose');
// Fields which are/could be "" cannot have `required` set to true as MongoDB will produce an error
const phenotypefields_schema = new mongoose.Schema({
    categoryPathLevel1: {
        type: String
    },
    data_source: {
        type: String,
        required: true
    },
    Original_name: {
        type: String
    },
    Original_dataset: {
        type: String
    },
    name: {
        type: String
    },
    id: {
        type: Number,
        unique: true
    },
    FieldID: {
        type: Number,
        unique: true
    },
    array: {
        type: Number
    },
    instances: {
        type: Number
    },
    type: {
        type: String
    },
    description: {
        type: String
    },
    descriptionStability: {
        type: String
    },
    descriptionCategoryID: {
        type: String
    },
    descriptionItemType: {
        type: String
    },
    valueType: {
        type: String
    },
    Sorting: {
        type: String
    },
    units: {
        type: String
    },
    descriptionStrata: {
        type: String
    },
    descriptionSexed: {
        type: String
    },
    orderPhenotype: {
        type: String
    },
    instance0Name: {
        type: String
    },
    instance1Name: {
        type: String
    },
    instance2Name: {
        type: String
    },
    instance3Name: {
        type: String
    },
    instance4Name: {
        type: String
    },
    instance5Name: {
        type: String
    },
    instance6Name: {
        type: String
    },
    instance7Name: {
        type: String
    },
    instance8Name: {
        type: String
    },
    instance9Name: {
        type: String
    },
    instance10Name: {
        type: String
    },
    descriptionParticipantsNo: {
        type: Number
    },
    instance11Name: {
        type: String
    },
    instance12Name: {
        type: String
    },
    instance13Name: {
        type: String
    },
    instance14Name: {
        type: String
    },
    instance15Name: {
        type: String
    },
    instance16Name: {
        type: String
    },
    instance17Name: {
        type: String
    },
    link: {
        type: String
    },
    bucket300: {
        type: Boolean
    },
    bucket500: {
        type: Boolean
    },
    bucket1000: {
        type: Boolean
    },
    bucket2500: {
        type: Boolean
    },
    bucket5000: {
        type: Boolean
    },
    bucket10000: {
        type: Boolean
    },
    coding: {
        type: String
    },
    values: {
        type: Object
    }
})

module.exports = mongoose.model('Phenotypefields', phenotypefields_schema, 'phenotypefields');
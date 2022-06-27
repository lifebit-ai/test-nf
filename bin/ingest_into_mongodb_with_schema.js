// INGEST INTO MONGO script
// Takes database name and uri and a JSON input file
// The script uses credentials to connect to database and a file to update collections with
// The script assumes the file name is a collection name and that input file is ndjson

// Flags:
// -d, --databaseName -Name of the database to ingest data into ('lifebit_ai_gel_ingestion')
// -u, --uri -URI to the database to ingest data into ('mongodb://localhost:27017')
// -i, --inputJson -JSON file containing participants documents (phenotypefields.json)
// -s, --schemaFile -Path to file with participants schema ('./phenotypefields.js')
// -t, --data_source; A string specifying data source ('default')
// -p, --poolSize; A number defining the maxPoolSize for the database (1000)

// usage
// node --no-warnings ./bin/ingest_into_mongodb_with_schema.js -i ./testdata/phenotypefields/phenotypefields_1.json -d 'lifebit_ai_gel_ingestion' -u 'mongodb://localhost:27017' -s ./phenotypefields.js -t 'default'
// node --no-warnings ./bin/ingest_into_mongodb_with_schema.js -i ./testdata/zpv_files/zpv_f1.json -d 'lifebit_ai_gel_ingestion' -u 'mongodb://localhost:27017' -s ./testdata/zpv_f1.js -t 'default'
//
// node --no-warnings ./bin/ingest_into_mongodb_with_schema.js --inputJson ./testdata/phenotypefields/phenotypefields_1.json --databaseName 'lifebit_ai_gel_ingestion' --uri 'mongodb://localhost:27017' --schemaFile ./phenotypefields.js --data_source 'default'
// node --no-warnings ./bin/ingest_into_mongodb_with_schema.js --inputJson ./testdata/zpv_files/zpv_f1.json --databaseName 'lifebit_ai_gel_ingestion' --uri 'mongodb://localhost:27017' --schemaFile ./testdata/zpv_f1.js --data_source 'default'

// functions
// closeConnection function closes the connection to MongoDB
function closeConnection() {
    mongoose.connection.close(function() {
        console.log('Mongoose disconnected ');
    });
}

// The function inserts a object into given collection
function addToCollection(model, document, logFileName, data_source){
    var promise = new Promise((resolve, reject)=>{
        var modelObject = new model();
        for (var key in document){
            if (document.hasOwnProperty(key)){
                // add keys and values from incoming document to GenomarkersModel instance
                modelObject[key]= document[key]
            }
        }
        modelObject["data_source"] = data_source
        modelObject.save((err, object)=>{
            if(err){
                // err code 11000 means the document with specified unique key already exists
                if(err.code == '11000'){
                    console.log('Exists in database')
                    fs.appendFileSync(logFileName, "Exists in database" +'\n')
                    resolve(true)
                }
                if(err.code != '11000'){
                    console.log(err)
                    fs.appendFileSync(logFileName, err +'\n')
                    resolve(true)
                }
            }
            if(!err){
                fs.appendFileSync(logFileName, "Object " + object._id + " was added to the '" + model.collection.collectionName + "' collection" +'\n')
                resolve(true)
            }
        })
    })
    return promise
}

// required packages
const fs = require('fs');
const { program } = require('commander');
const mongoose = require('mongoose');
const readline = require('readline');

// Take inputs from command line
program
    .description('DATABASE INGESTION script takes three input JSON files and ingests them into MONGODB')
    .option('-d, --databaseName <type>', 'Name of the database to ingest data into', 'lifebit_ai_gel_ingestion')
    .option('-u, --uri <type>', 'URI to the database to ingest data into', 'mongodb://localhost:27017')
    .option('-s, --schemaFile <type>', 'Path to file with schema', './phenotypefields.js')
    .option('-i, --inputJson <type>', 'JSON file containing documents (ex: phenotypefields.json)')
    .option('-t, --data_source <tstringype>', 'A string specifying data source (default)')
    .option('-p, --poolSize <number>', 'A number defining the maxPoolSize for the database', 1000);
program.parse();

var dbName = program.opts().databaseName;
var uri = program.opts().uri;
var inputJsonPath = program.opts().inputJson;
var schemaPath = program.opts().schemaFile;
var data_source = program.opts().data_source;
var poolSize = program.opts().poolSize;

const options = {
    useNewUrlParser: true,
    maxPoolSize: poolSize,
    useCreateIndex: true,
    autoIndex: true,
    keepAlive: true,
    bufferMaxEntries: 0,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip trying IPv6
    useFindAndModify: false,
    useUnifiedTopology: true
}

// Extract json file name from file path
var inputJsonName=inputJsonPath.split('/')[inputJsonPath.split('/').length-1].split('.')[0];

// Extract schema file name from file path
var schemaName='./'+schemaPath.split('/')[schemaPath.split('/').length-1];

// initialise log file
var logFileName = 'ingest_' + inputJsonName + '.log'
fs.writeFileSync(logFileName, "");

// Schema
if(fs.existsSync(schemaPath)){
    const model = require(schemaName);

    async function main() {
        // initialise variables
        mongoose.connect(uri + '/' + dbName, options);
        try {
            mongoose.connection.on('connected', function() {
                // Check if file exist
                if (fs.existsSync(inputJsonPath)) {
                    const readlineInterface = readline.createInterface({
                        input: fs.createReadStream(inputJsonPath),
                        crlfDelay: Infinity
                    });
                    var promiseArray = []
                    readlineInterface.on('line', (line) => {
                        if(line!=''){
                            // ingest
                            promiseArray.push(addToCollection(model, JSON.parse(line), logFileName, data_source))
                        }
                    });
                    readlineInterface.on('close', ()=>{
                        // closeConnection()
                        Promise.all(promiseArray).then(result=>{
                            closeConnection()
                        })
                    })
                }
                if(!fs.existsSync(inputJsonPath)) {
                    fs.appendFileSync(logFileName, "Input JSON file couldn't be found" +'\n')
                    closeConnection()
                }
            })
            mongoose.connection.on('error', function() {
                fs.appendFileSync(logFileName, "Connection to the database was unsuccessful" +'\n')
            })
        } catch (e) {
            console.error(e);
            fs.appendFileSync(logFileName, "Connection to the database was unsuccessful" +'\n')
        }
    }
    // Run main function
    main();
}

if(!fs.existsSync(schemaPath)){
    console.log("No schema file found")
    fs.appendFileSync(logFileName, "No schema file found" +'\n')
}
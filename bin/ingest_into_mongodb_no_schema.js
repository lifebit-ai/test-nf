// INGEST INTO MONGO script
// Takes database name, uri, collection name and a JSON input file
// The script uses credentials to connect to database and a file to update collections with
// The script assumes that the input file is ndjson

// Flags:
// -d, --databaseName -Name of the database to ingest data into ('lifebit_ai_gel_ingestion')
// -u, --uri -URI to the database to ingest data into ('mongodb://localhost:27017')
// -c, --collectionName -The collection name to ingest data into (participants)
// -i, --inputJson; JSON file containing participants documents (participants.json)
// -t, --data_source; A string specifying data source ('default')
// -p, --poolSize; A number defining the maxPoolSize for the database (1000)

// usage
// node --no-warnings  ./bin/ingest_into_mongodb_no_schema.js -i ./testdata/participants/participants_1.json -d 'lifebit_ai_gel_ingestion' -u 'mongodb://localhost:27017' -c 'participants' -t 'default'
// node --no-warnings  ./bin/ingest_into_mongodb_no_schema.js -i ./testdata/phenotypefields/phenotypefields_1.json -d 'lifebit_ai_gel_ingestion' -u 'mongodb://localhost:27017' -c 'phenotypefields' -t 'default'
// node --no-warnings  ./bin/ingest_into_mongodb_no_schema.js -i ./testdata/zpv_files/zpv_f1.json -d 'lifebit_ai_gel_ingestion' -u 'mongodb://localhost:27017' -c 'zpv_f1' -t 'default'

// node --no-warnings  ./bin/ingest_into_mongodb_no_schema.js --inputJson ./testdata/participants/participants_1.json --databaseName 'lifebit_ai_gel_ingestion' --uri 'mongodb://localhost:27017' --collectionName 'participants' --data_source 'default'
// node --no-warnings  ./bin/ingest_into_mongodb_no_schema.js --inputJson ./testdata/phenotypefields/phenotypefields_1.json --databaseName 'lifebit_ai_gel_ingestion' --uri 'mongodb://localhost:27017' --collectionName 'phenotypefields' --data_source 'default'

// The function inserts a object into given collection
async function addToCollection(client, dbName, collectionName, document, logFileName, data_source){
    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    document["data_source"] = data_source
    await collection.insertMany([document], (err)=>{
        if(err){
            fs.appendFileSync(logFileName, collectionName + ' error: ' + err +'\n')
        } else {
            fs.appendFileSync(logFileName, "The '" + collectionName + "' collection was successfully ingested into MongoDB" +'\n')
        }
    })
}

// required packages
const fs = require('fs');
const { program } = require('commander');
const readline = require('readline');

// Take inputs from command line
program
    .description('DATABASE INGESTION script takes three input JSON files and ingests them into MONGODB')
    .option('-d, --databaseName <string>', 'Name of the database to ingest data into', 'lifebit_ai_gel_ingestion')
    .option('-u, --uri <string>', 'URI to the database to ingest data into', 'mongodb://localhost:27017')
    .option('-c, --collectionName <string>', 'The collection name to ingest data into', 'participants')
    .option('-i, --inputJson <file>', 'JSON file containing participants documents','participants.json')
    .option('-t, --data_source <string>', 'A string specifying data source ','default')
    .option('-p, --poolSize <number>', 'A number defining the maxPoolSize for the database', 1000);
program.parse();

var dbName = program.opts().databaseName;
var uri = program.opts().uri;
var collectionName = program.opts().collectionName;
var inputJsonPath = program.opts().inputJson;
var data_source = program.opts().data_source;
var poolSize = program.opts().poolSize;
console.log(poolSize)
// Extract json file name from file path
var inputJsonName=inputJsonPath.split('/')[inputJsonPath.split('/').length-1].split('.')[0];

// initialise log file
var logFileName = 'ingest_'+ inputJsonName + '.log'
fs.writeFileSync(logFileName, "");

async function main() {
	// initialise variables
    const {MongoClient} = require('mongodb',{ useUnifiedTopology: true, maxPoolSize: poolSize });
    const client = new MongoClient(uri);

    try {
        // Conect to the MongoDB cluster
        await client.connect();

        // Check if file exist
        if (fs.existsSync(inputJsonPath)) {
            const readlineInterface = readline.createInterface({
                input: fs.createReadStream(inputJsonPath),
                crlfDelay: Infinity
            });

            readlineInterface.on('line', (line) => {
                if(line!=''){
                    // ingest
                    addToCollection(client, dbName, collectionName, JSON.parse(line), logFileName, data_source)
                }
            });
            readlineInterface.on('close', ()=>{
                client.close();
            })
        } else {
            fs.appendFileSync(logFileName, "Input JSON file couldn't be found" +'\n')
        }
    } catch (e) {
        console.error(e);
        fs.appendFileSync(logFileName, "Connection to the database was unsuccessful" +'\n')
    }
}
// Run main function
main().catch(console.error);
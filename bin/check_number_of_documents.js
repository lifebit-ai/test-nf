// CHECK NUMBER OF DOCUMENTS is a script
// which tries to connect to a MongoDB database using default values or given credentials
// and counts the number of documents in user specified collection in user specified database

// To run:
// minimum:
// node --no-warnings ./bin/check_number_of_documents.js
// full set:
// node --no-warnings ./bin/check_number_of_documents.js -d 'lifebit_ai_gel_ingestion' -u 'mongodb://localhost:27017' -c 'participants'

// required packages
const { program } = require('commander');
const fs = require('fs');

// countDocuments function
async function countDocuments(client, dbName, collectionName) {
    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const estimate = await collection.estimatedDocumentCount();
    return(estimate)
}

// Take inputs from command line
program
    .description('CHECK NUMBER OF DOCUMENTS is a script which returns number of documents in a MongoDB collection')
    .option('-d, --databaseName <String>', 'Name of the database to connect to', 'lifebit_ai_gel_ingestion')
    .option('-u, --uri <String>', 'URI to the database to connect to', 'mongodb://localhost:27017')
    .option('-c, --collectionName <String>', 'Collection name to count the number of documents in', 'participants')
    .option('-p, --outputFilePrefix <String>', 'Prefix added to the output log file', '')
    .option('-s, --poolSize <number>', 'A number defining the maxPoolSize for the database', 1000);
program.parse();

// Initialise variables
var dbName = program.opts().databaseName;
var uri = program.opts().uri;
var collectionName = program.opts().collectionName;
var outputFilePrefix = program.opts().outputFilePrefix;
var poolSize = program.opts().poolSize;

var logOutputFile = outputFilePrefix+collectionName+"_number.log"

fs.writeFileSync(logOutputFile, "");

async function main() {
	// initialise variables
    const { MongoClient } = require('mongodb',{ useUnifiedTopology: true, maxPoolSize: poolSize });
    const client = new MongoClient(uri);
    try {
        // Conect to the MongoDB cluster
        await client.connect();
        console.log('Connected to '+dbName+' database');
        countDocuments(client, dbName, collectionName).then(numberOfDocuments=>{
            fs.writeFileSync(logOutputFile, "" + numberOfDocuments);
        })
    } catch (e) {
        console.error(e);
        fs.appendFileSync(logOutputFile, "Script was unsuccesfull" +'\n')
    } finally {
        await client.close();
    }
}

// Run main function
main().catch(console.error);
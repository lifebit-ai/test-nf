// REMOVE COLLECTION BY DATA SOURCE script
// Takes database name and uri, collection name and a data_source parameter
// The script uses credentials to connect to database and a collection name and data_source to remove it

// Flags:
// -d, --databaseName -Name of the database to ingest data into ('lifebit_ai_gel_ingestion')
// -u, --uri -URI to the database to ingest data into ('mongodb://localhost:27017')
// -c, --collectionName -Name of the collection containing documents ('participants')
// -t, --data_source; A string specifying data source ('default')

// usage
// node --no-warnings ./bin/remove_collection_by_data_source.js -c participants -d 'lifebit_ai_gel_ingestion' -u 'mongodb://localhost:27017' -t 'default'
// node --no-warnings ./bin/remove_collection_by_data_source.js -c phenotypefields -d 'lifebit_ai_gel_ingestion' -u 'mongodb://localhost:27017' -t 'default'
//
// node --no-warnings ./bin/remove_collection_by_data_source.js --collectionName participants --databaseName 'lifebit_ai_gel_ingestion' --uri 'mongodb://localhost:27017'  --data_source 'default'
// node --no-warnings ./bin/remove_collection_by_data_source.js --collectionName phenotypefields --databaseName 'lifebit_ai_gel_ingestion' --uri 'mongodb://localhost:27017' --data_source 'default'

// The function drops a given collection from database
async function removeCollection(client, dbName, collectionName, logFileName, data_source){
    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    var query = { "data_source": data_source };
    await collection.deleteMany(query, function(err) {
        if (err){
            fs.appendFileSync(logFileName, collectionName + ' error: ' + err +'\n')
        } else {
            fs.appendFileSync(logFileName, "The '" + collectionName +" with data_source: " + data_source + "' collection was successfully removed from MongoDB" +'\n')
        }
    });
    return(null)
}

// required packages
const fs = require('fs');
const { program } = require('commander');

// Take inputs from command line
program
    .description('REMOVE COLLECTION script takes a collection name and removes a collection by the same name from MONGODB')
    .option('-d, --databaseName <type>', 'Name of the database to ingest data into', 'lifebit_ai_gel_ingestion')
    .option('-u, --uri <type>', 'URI to the database to ingest data into', 'mongodb://localhost:27017')
    .option('-c, --collectionName <type>', 'Name of the collection containing documents (ex: participants)')
    .option('-t, --data_source <tstringype>', 'A string specifying data source (default)');
program.parse();

var dbName = program.opts().databaseName;
var uri = program.opts().uri;
var collectionName = program.opts().collectionName;
var data_source = program.opts().data_source;

// initialise log file
var logFileName = 'remove_'+collectionName+'.log'
fs.writeFileSync(logFileName, "");

async function main() {
	// initialise variables
    const {MongoClient} = require('mongodb',{ useUnifiedTopology: true });
    const client = new MongoClient(uri);
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        // count the number of documents before removal
        removeCollection(client, dbName, collectionName, logFileName, data_source)
    } catch (e) {
        console.error(e);
        fs.appendFileSync(logFileName, "Connection to the database was unsuccessful" +'\n')
    } finally {
        await client.close();
    }
}
// Run main function
main().catch(console.error);
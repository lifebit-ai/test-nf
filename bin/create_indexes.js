// CREATE INDEXES script
// takes database name and uri as inputs and creates indexes to previously ingested data

// Flags:
// -d, --databaseName -Name of the database to ingest data into ('lifebit_ai_gel_ingestion')
// -u, --uri -URI to the database to ingest data into ('mongodb://localhost:27017')
// -c, --collectionName -Name of the collection for the index creation ('participants')
// -p, --poolSize; A number defining the maxPoolSize for the database (1000)

// usage
// node --no-warnings  ./bin/create_indexes.js -d 'lifebit_ai_gel_ingestion' -u 'mongodb://localhost:27017' -c 'participants'
//
// node --no-warnings  ./bin/create_indexes.js --databaseName 'lifebit_ai_gel_ingestion' --uri 'mongodb://localhost:27017' --collectionName 'participants'

// required packages
const fs = require('fs');
const { program } = require('commander');

// Take inputs from command line
program
    .description('CREATE INDEXES takes database name and uri and creates indexes in MONGODB')
    .option('-d, --databaseName <string>', 'Name of the database', 'lifebit_ai_gel_ingestion')
    .option('-u, --uri <string>', 'URI to the database', 'mongodb://localhost:27017')
    .option('-c, --collectionName <string>', 'Name of the collection for the index creation', 'participants')
    .option('-p, --poolSize <number>', 'A number defining the maxPoolSize for the database', 1000);
program.parse();

var dbName = program.opts().databaseName;
var uri = program.opts().uri;
var collectionName = program.opts().collectionName;
var poolSize = program.opts().poolSize;

var logFileName = 'create_indexes_' + collectionName + '.log'
fs.writeFileSync(logFileName, '');

async function main() {
	// initialise variables
    const { MongoClient}  = require('mongodb',{ useUnifiedTopology: true, maxPoolSize: poolSize });
    const client = new MongoClient(uri);

    try {
        // Conect to the MongoDB cluster
        await client.connect();
        const db = client.db(dbName);
        const collections = await db.collections();
        collections.forEach(collection=>{
            collectionInDatabaseName = collection.collectionName
            // Creating participants indexes
            if(collectionInDatabaseName == "participants" && collectionName == "participants"){
                const participants = db.collection("participants")
                participants.createIndex({i:1});
                participants.createIndex({"$**":1});
                fs.appendFileSync(logFileName, "Participants indexes created" +'\n')
            }
            // Creating zpv_f* indexes
            if((collectionInDatabaseName == collectionName) && collectionName.startsWith('zpv_')){
                var zpv = db.collection(collectionInDatabaseName)
                zpv.createIndex( { "v": 1, "is":1 } )
                zpv.createIndex( { "v": 1, "is":1, "i": 1 } )
                fs.appendFileSync(logFileName, collectionInDatabaseName+ " indexes created" +'\n')
            }
        });
    } catch (e) {
        console.error(e);
        fs.appendFileSync(logFileName, "Couldn't connect to database" +'\n')
    } finally {
        await client.close();
    }
}
// Run main function
main().catch(console.error);
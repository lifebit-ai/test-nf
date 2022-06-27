// GET ALL ZPV COLLECTIONS is a script
// which takes a database name and uri
// and lists all collections in a MongoDB database starting with zpv_f

// To run:
// minimum:
// node --no-warnings ./bin/getAllZpvCollections.js --databaseName 'lifebit_ai_gel_ingestion2' --uri 'mongodb://localhost:27017'

// required packages
const { program } = require('commander');
const fs = require('fs');

// Take inputs from command line
program
    .description('GET ALL ZPV COLLECTIONS is a script which lists all collections in a MongoDB database starting with zpv_f')
    .option('-d, --databaseName <type>', 'Name of the database to list collections in', 'lifebit_ai_gel_ingestion')
    .option('-u, --uri <type>', 'URI to the database to list collections in', 'mongodb://localhost:27017');
program.parse();

var dbName = program.opts().databaseName;
var uri = program.opts().uri;
var logOutputFile = "list_all_zpv_collections.log"
fs.writeFileSync(logOutputFile, '');
var outputFile = "list_all_zpv_collections.tsv"
fs.writeFileSync(outputFile, '');

async function main() {
	// initialise variables
    const { MongoClient } = require('mongodb',{ useUnifiedTopology: true });
    const client = new MongoClient(uri);

    try {
        // Conect to the MongoDB cluster
        await client.connect();
        const database = client.db(dbName);
        const collections = await database.collections();
        var counter = 0
        collections.forEach(collection=>{
            collectionName = collection.collectionName
            if(collectionName.startsWith("zpv_")){
                if(counter>0){
                    fs.appendFileSync(outputFile, '\n')
                }
                counter = counter+1
                fs.appendFileSync(outputFile, collectionName)
            }
        });
        fs.appendFileSync(logOutputFile, "Number of zpv_f* collections detected: "+ counter +'\n')
    } catch (e) {
        console.error(e);
        fs.appendFileSync(logOutputFile, "Connection to the database was unsuccessful" +'\n')
    } finally {
        await client.close();
    }
}
// Run main function
main().catch(console.error);
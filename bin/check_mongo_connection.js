// CHECK MONGO CONNECTION is a script
// which tries to connect to a MongoDB database using default values or given credentials
// the script prints a console.log for pass or fail

// To run:
// minimum:
// node ./bin/check_mongo_connection.js
// full set:
// node ./bin/check_mongo_connection.js -d lifebit-ai_s3-data -u mongodb://localhost:27017
// node ./bin/check_mongo_connection.js --databaseName lifebit-ai_s3-data --uri mongodb://localhost:27017

// required packages
const mongoose = require('mongoose');
const { program } = require('commander');
const fs = require('fs');

// closeConnection function closes the connection to MongoDB
function closeConnection() {
    mongoose.connection.close(function() {
        console.log('Mongoose disconnected ');
    });
}

// Take inputs from command line
program
    .description('CHECK MONGO CONNECTION is a script which checks the connection with a MongoDB database')
    .option('-d, --databaseName <type>', 'Name of the database to ingest data into', 'lifebit_ai_gel_ingestion')
    .option('-u, --uri <type>', 'URI to the database to ingest data into', 'mongodb://localhost:27017');
program.parse();

var dbName = program.opts().databaseName;
var uri = program.opts().uri;
var logOutputFile = "check_mongo_connection.log"

// Connect to mongoDB
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    retryReads: true,
    autoIndex: false, // Don't build indexes
    serverSelectionTimeoutMS: 50000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 55000, // Close sockets after 45 seconds of inactivity
    // family: 4 // Use IPv4, skip trying IPv6
  };

mongoose.connect(uri + dbName, options);

// If connected print information
mongoose.connection.on('connected', function() {
    fs.writeFileSync(logOutputFile, 'Connection status: connection to database '+dbName+' was successful.');
    console.log('Connection status: connection to database '+dbName+' was successful.');
    closeConnection();
})

// If cannot connect beacause of error throw the error
mongoose.connection.on('error', function(err) {
    fs.writeFileSync(logOutputFile, 'Mongoose connection error: ' + err);
    console.log('Mongoose connection error: ' + err);
});
# Pipeline documentation

<ins>Table of contents</ins>

  - [1 - Pipeline description](#1---pipeline-description)
  - [2 - Quick start](#2---quick-start)
  - [3 - Options](#3---options)
  - [4 - Usage](#4---usage)
  - [5 - Deployment options](#5---deployment-options)
  - [6 - Data Source field](#6---data_source-field)

## 1 - <ins>Pipeline description</ins>

### 1.1 - <ins>Pipeline overview</ins>

The purpose of this pipeline is to ingest data into a MongoDB database. The pipeline can ingest 3 different types of collections: `phenotypefields`, `participants`, `zpv_f*`. In addition, it can remove `phenotypelabels` (which must be updated after each ingestion by the CB BE). The set of scripts can ingest the data with or without a schema to validate the documents before ingestion. The pipeline has a set of parameters that allow for a clean ingestion or for the data to be appended in to existing database.

![GEL-data-ingestion-mongodb-ingestion](https://user-images.githubusercontent.com/45628304/174068041-41ba1780-ae4c-4bb5-8c96-9da01a29d65f.jpg)

### 1.2 - <ins>Inputs</ins>

The pipeline main inputs are `CSV` lists of input files for each collection. Each collection can be ingested separately so not all 3 lists are required for each run. Each `CSV` should have one column called 'input' and contain list of files with filenames starting with the collection name. For example a list of files to be ingested as participant collection should look like this:
```
input
testdata/participants/participant1.json
testdata/participants/participant2.json
```
Participant files names should start with `participant`, `phenotypefields` should start with `phenotypefields` and `zpv_f*` should start with 'zpv_f'.

If you generate the files using a CloudOS pipeline and as a result need to add an s3 bucket location to your input files you can use the '*_s3_link' parameter. For example if your input CSV file looks like that:
```
input
participant.json
```
And you specify the participants_s3_link as: `s3/user/location` the pipeline will look for `s3/user/location/participant.json`.

### 1.3 - <ins>Pipeline modes</ins>

The pipeline can be run in two modes:
- check connection
- ingest

1. The check connection mode should be used first, in order to establish if the database connection is working as expected. To run this mode parameter: `dry_run` needs to be set to true.

2. The ingest mode allows for the data ingestion

### 1.4 - <ins>Default processes</ins>

1. For check connection mode:

- `check_mongo_connection`: takes database name and uri. The script uses credentials to try to connect to the database The script produces a log: 'check_mongo_connection.log'

- `report_only_for_database_check`: process creates a report for the pipeline.

2. For ingest mode:

- `ingest`: process that depending on the presence of schema file runs:

`ingest_into_mongodb_no_schema.js` script: the script takes database name, collection name and database uri as well as a JSON input file. The script use credentials to connect to database and a file to update collections with. The script assumes that input file is an ndjson and returns a log file named: input file name + `_ingest_`+ collection name + `_into_mongo.log`

`ingest_into_mongodb_with_schema.js` script: this script takes database name and uri as well as a JSON input file and a Java-Script schema file. The script uses credentials to connect to database, a script to validate the data and a file to update collections with. The script takes the collection name from the schema file and assumes that input file is ndjson. The script returns a log file named: input file name + `_ingest_`+ collection name + `_into_mongo.log`. The schema is a list of fields we can expect for a given object. If fields are required they need to be present and not empty for each ingested object but if field is not required lack of given field won't stop the ingestion. If field is not present in the schema file it will not be ingested. If a field has a different type than the one specified in schema file the system will try to cast current value to expected type. If that will not be possible system will throw an error for given object and the object will not be ingested. Currently the participants.json file cannot be validated against the schema. Due to the data model being used schema for participants objects cannot be predicted (for both field name and type).

Each ingestion script process ends up with `create_indexes` script. The script creates a list of indexes specified below and results in `create_indexes.log` file.

Current index list:
- `db.participants.createIndex({i:1});`
- `db.participants.createIndex({"$**":1});`

- `db.zpv_f***.createIndex( { "v": 1, "is":1 } );`
- `db.zpv_f***.createIndex( { "v": 1, "is":1, "i": 1 } );`

- `report`: process creates a report for the pipeline.


### 1.5 - <ins>Optional processes</ins>

1. For ingest mode:

if you want to remove the data from the collection prior to ingesting:

- `remove_collection`: process removes the whole given collection from the database or only the data with a matching data_source value.
If you want to remove the whole collection use `clean_database` parameter as true and run the remove_collection script. The script takes database name and uri and a collection name. The script uses credentials to connect to the database and a collection name to remove it. As an output script creates a log file: `remove_` + collectionName + `_from_mongo.log`.
In order to remove only the data with matching data_source 'clean_database' and 'append' need to be set up to false and you need to provide 'data_source' value. That will run the remove_collection_by_data_source script that in addition to the parameters in remove_collection script uses the 'data_source' parameter to remove the data.

### 1.5 - <ins>Output</ins>

The full run of the pipeline will produce following output:
```
results
├── MultiQC
│   └── multiqc_report.html
├── ingestion-logs
│   ├── create_indexes*.log
│   ├── ingest*.log
├── removal-logs
│   ├── remove*.log
├── schema-logs
│   ├── *SchemaStatus.log
├── report_tables
│   ├── participants_ingest.csv
│   ├── participants_remove.csv
│   ├── phenotypefields_ingest.csv
│   ├── phenotypefields_remove.csv
│   ├── zpvs_ingest.csv
│   ├── zpvs_remove.csv
│   ├── phenolabels_remove.csv
├── phenotypefields
│   ├── final_phenotypefields*.csv
├── participants
│   ├── final_participant*.csv
├── zpvs
│   ├── final_participant*.csv
├── zpvs-logs
│   ├── list_all_zpv_collections.log
│   ├── list_all_zpv_collections.tsv
```

## 2 - <ins>Quick start</ins>

The typical command for running the pipeline is as follows:

```
nextflow run main.nf \
  --db_name "lifebit_ai_gel_ingestion" \
  --db_uri "mongodb://localhost:27017" \

  --phenotypefields "testdata/phenotypefields_files_list_local.csv" \
  --participants "testdata/participants_files_list_local.csv" \
  --zpv_list "testdata/zpv_files_list_local.csv" \

  --phenotypefields_schema "bin/no_schema/no_schema_phenotypefields.js" \
  --zpv_schema "bin/no_schema/no_schema_zpv.js" \

  --dry_run true
```

## 3 - <ins>Options</ins>

The following table describes all parameters used by the pipeline. These paramaters are defined in `nextflow.config` and/or the configuration files found in `conf/`.

### 3.1 - <ins>Essential parameters</ins>

| param name | default values | description |
|---|---|---|
| db_name | false | mongoDB database name of the MongoDB used for ingesting |
| db_uri | - | mongoDB URI (SRV format) to the MongoDB used for ingesting |
| phenotypefields | false | a CSV file with the list of the phenotypefields as an ndjson files |
| participants | false | a CSV file with the list of the participants as an ndjson files |
| zpv_list | false | a CSV file with a list of JSON files with zpv_f* collection as an ndjson files |
| data_source | default | a string that is used to characterise the data ingested; a combination of client name and version |

### 3.2 - <ins>Non-essential parameters</ins>

| param name | default values | description |
|---|---|---|
| dry_run | true | a true or false parameter. If false run the whole pipeline, if true just check mongoDB connection |
| param_via_aws | false | a true or false parameter. If true the database name and uri are taken from the aws parameter store |
| append | false | a true or false parameter. If true data will be appended to the database, if false data will be overwritten |
| clean_database | false | a true or false parameter. If true data from all dataSources will be removed from the database, prior to ingestion |
| send_signal | false | a true or false parameter. If true a request will be send to front-end after the ingestion |
| remove_phenolabels | true | a true or false parameter. If true phenolabels collection will be removed |
| split_number_of_lines | 1000 | a parameter describing the number of lines each json will be split into before ingestion |
| split_number_of_prefixes | 3 | a parameter describing the number of prefixes used for splitting json files before ingestion |
| zpv_s3_link | false | if false zpv_list is read normaly. If populated s3 will be added as a begining of each row in zpvs list file |
| phenotypefields_s3_link | false | if false phenotypefields is read normaly. If populated s3 link will be added as a begining of each row in phenotypefields list file |
| participants_s3_link | false | if false participants is read normaly. If populated s3 will be added as a begining of each row in participants list file |
| phenotypefields_schema | bin/no_schema/no_schema_phenotypefields.js | a phenotypefields JS schema file (if not supplied an empty one will be read) |
| zpv_schema | bin/no_schema/no_schema_zpv.js | a ZPV JS schema file (if not supplied an empty one will be read) |

## 4 - <ins>Usage</ins>

### 4.1 - <ins>Execution examples</ins>

The typical command for running this pipeline is as follows:

**1) Check connection:**

```
nextflow run main.nf \
--db_name "local_testing" \
--db_uri "mongo:database/uri" \
--dry_run true
```

**2) Ingest new data to clean database without schema using s3 links:**

```
nextflow run main.nf \
--db_name "local_testing" \
--db_uri "mongo:database/uri" \
--phenotypefields "testdata/phenotypefields_files_list_no_s3.csv" \
--participants "testdata/participants_files_list_no_s3.csv" \
--zpv_list "testdata/zpv_files_list_no_s3.csv" \
--phenotypefields_schema "bin/no_schema/no_schema_phenotypefields.js" \
--zpv_schema "bin/no_schema/no_schema_zpv.js" \
--zpv_s3_link "testdata/zpv_files/" \
--phenotypefields_s3_link "testdata/phenotypefields/" \
--participants_s3_link "testdata/participants/" \
--clean_database true \
--data_source "data_source"
```

**3) Append data with schema:**

```
nextflow run main.nf \
--db_name "local_testing" \
--db_uri "mongo:database/uri" \
--phenotypefields "testdata/phenotypefields_files_list_no_s3.csv" \
--participants "testdata/participants_files_list_no_s3.csv" \
--zpv_list "testdata/zpv_files_list_no_s3.csv" \
--phenotypefields_schema "bin/schema/phenotypefields.js" \
--zpv_schema "bin/schema/zpv.js" \
--append true \
--data_source "data_source"
```

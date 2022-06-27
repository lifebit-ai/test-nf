#!/usr/bin/env nextflow
/*
===============================================================================
                      lifebit-ai/gel-mongodb-ingestion
===============================================================================
 lifebit-ai/gel-mongodb-ingestion pipeline
 #### Homepage / Documentation
 https://github.com/lifebit-ai/gel-mongodb-ingestion
-------------------------------------------------------------------------------
*/

/*---------------------------------------
  Define and show help message if needed
-----------------------------------------*/

def helpMessage() {

    log.info """

    Usage:
    The typical command for running the pipeline is as follows:

    nextflow run main.nf \
    --db_name "lifebit_ai_gel_ingestion" \
    --db_uri "mongodb://localhost:27017" \
    --data_source "test" \
    --phenotypefields "testdata/phenotypefields_files_list_local.csv" \
    --participants "testdata/participants_files_list_local.csv" \
    --zpv_list "testdata/zpv_files_list_local.csv" \
    --phenotypefields_schema "bin/no_schema/no_schema_phenotypefields.js" \
    --zpv_schema "bin/no_schema/no_schema_zpv.js" \
    --dry_run true

    Essential parameters:
    --db_name                                 The database name of the MongoDB used for ingesting.
    --db_uri                                  MongoDB URI (SRV format) to the MongoDB used for ingesting.
    --data_source                              A string value added to data specifying the data source.
    --phenotypefields                         CSV file with the list of the phenotypefields JSON files.
    --participants                            CSV file with the list of the participants JSON files.
    --zpv_list                                CSV file with the list of the zpv_f* JSON files.

    Non-essential parameters:
    --dry_run                                 A true or false parameter. If false run the whole pipeline, if true just check mongoDB connection.
    --param_via_aws                           A true or false parameter. If true the database name and uri are taken from the aws parameter store.
    --zpv_s3_link                             If false zpv_list is read normaly. If populated s3 will be added as a begining of each row in zpvs list file.
    --phenotypefields_s3_link                 If false phenotypefields is read normaly. If populated s3 link will be added as a begining of each row in phenotypefields list file.
    --participants_s3_link                    If false participants is read normaly. If populated s3 will be added as a begining of each row in participants list file.

    --phenotypefields_schema                   Phenotypefields JS schema file (if not supplied an empty one will be read).
    --zpv_schema                               ZPV JS schema file (if not supplied an empty one will be read).

    --split_number_of_lines                   A parameter describing the number of lines each json will be split into before ingestion (default is 1000)
    --split_number_of_prefixes                A parameter describing the number of prefixes used for splitting json files before ingestion (default is 3)

    --remove_phenolabels                      A true or false parameter. If true phenolabels collection will be removed (default is true).
    --append                                  A true or false parameter. If true data will be appended to the database, if false data will be overwritten.
    --clean_database                          A true or false parameter. If true data from all dataSources will be removed from the database, prior to ingestion.
    --send_signal                             A true or false parameter. If true a request will be send to front-end after the ingestion.

    """.stripIndent()
}

// Show help message
if (params.help) {
  helpMessage()
  exit 0
}



/*--------------------------------------------------------
  Defining and showing header with all params information
----------------------------------------------------------*/

// Header log info

def summary = [:]

if (workflow.revision) summary['Pipeline Release'] = workflow.revision

summary['Output dir']                                  = params.outdir
summary['Launch dir']                                  = workflow.launchDir
summary['Working dir']                                 = workflow.workDir
summary['Script dir']                                  = workflow.projectDir
summary['User']                                        = workflow.userName

summary['db_name']                                     = params.db_name
summary['data_source']                                     = params.data_source

summary['phenotypefields']                             = params.phenotypefields
summary['participants']                                = params.participants
summary['zpv_list']                                    = params.zpv_list

summary['phenotypefields schema']                      = params.phenotypefields_schema
summary['zpv schema']                                  = params.zpv_schema

summary['zpv_s3_link']                                 = params.zpv_s3_link
summary['participants_s3_link']                        = params.participants_s3_link
summary['phenotypefields_s3_link']                     = params.phenotypefields_s3_link

summary['remove_phenolabels']                          = params.remove_phenolabels
summary['dry_run']                                     = params.dry_run
summary['param_via_aws']                               = params.param_via_aws
summary['append']                                      = params.append
summary['clean_database']                              = params.clean_database

summary['zpv_s3_link']                                 = params.zpv_s3_link
summary['participants_s3_link']                        = params.participants_s3_link
summary['phenotypefields_s3_link']                     = params.phenotypefields_s3_link

summary['remove_phenolabels']                          = params.remove_phenolabels
summary['dry_run']                                     = params.dry_run
summary['param_via_aws']                               = params.param_via_aws
summary['append']                                      = params.append
summary['send_signal']                                      = params.send_signal

log.info summary.collect { k,v -> "${k.padRight(18)}: $v" }.join("\n")
log.info "-\033[2m--------------------------------------------------\033[0m-"



/*----------------------
  Setting up input data
-------------------------*/
// Check that db_name, db_uri and input files has been provided
if (!params.db_name) { exit 1, "You have not supplied the database name.\nPlease use --db_name."}
if (!params.db_uri) { exit 1, "You have not supplied the database uri.\nPlease use --db_uri."}

// Define Channels from input
projectDir = workflow.projectDir

Channel.value(params.db_uri).set{ ch_db_uri }
Channel.value(params.db_name).set{ ch_db_name }
Channel.value(params.data_source).set{ ch_data_source }
Channel.value(params.poolSize).set{ ch_poolSize }
Channel.value(params.apiKey).set{ ch_apiKey }
Channel.value(params.location).set{ ch_location }


if (params.phenotypefields){
  Channel
    .fromPath(params.phenotypefields)
    .splitCsv(header:true)
    .map{ row -> row.input }
    .flatten()
    .set{ ch_phenotypefields }
}

if (params.participants){
  Channel
    .fromPath(params.participants)
    .splitCsv(header:true)
    .map{ row -> row.input }
    .flatten()
    .set{ ch_participants }
}

Channel.value(params.zpv_s3_link).set{ ch_zpv_s3_link }
Channel.value(params.participants_s3_link).set{ ch_participants_s3_link }
Channel.value(params.phenotypefields_s3_link).set{ ch_phenotypefields_s3_link }

if(params.zpv_list){
  Channel
    .fromPath(params.zpv_list)
    .splitCsv(header:true)
    .map{ row -> row.input }
    .flatten()
    .set{ ch_zpv_files }
}

// Schemas
Channel.fromPath("${params.phenotypefields_schema}").set{ ch_phenotypefields_schema }
Channel.fromPath("${params.zpv_schema}").set{ ch_zpv_schema }



/*-------------------------
  Setting up input scripts
----------------------------*/
Channel.fromPath("${projectDir}/bin/check_mongo_connection.js").set { ch_check_mongo_connection_script }
Channel.fromPath("${projectDir}/bin/remove_collection.js").into{ ch_remove_script_for_phenotypefields; ch_remove_script_for_participants; ch_remove_script_for_zpv_collections; ch_remove_script_for_phenolabels_collections }
Channel.fromPath("${projectDir}/bin/remove_collection_by_data_source.js").into{ ch_data_source_remove_script_for_phenotypefields; ch_data_source_remove_script_for_participants; ch_data_source_remove_script_for_zpv_collections }
Channel.fromPath("${projectDir}/bin/getAllZpvCollections.js").set{ ch_getAllZpvCollections_script }
Channel.fromPath("${projectDir}/bin/create_indexes.js").into{ ch_create_indexes_for_participants_script; ch_create_indexes_for_zpvs_script }
Channel.fromPath("${projectDir}/bin/check_number_of_documents.js").into{ ch_check_number_of_documents_script_for_after_removal; ch_check_number_of_documents_script_for_after_ingestion }
Channel.fromPath("${projectDir}/bin/create_ingest_fields_log.sh").set{ ch_create_ingest_fields_log_script }
Channel.fromPath("${projectDir}/bin/create_remove_fields_log.sh").set{ ch_create_remove_fields_log_script }

// If schemas are supplied
Channel.fromPath("${projectDir}/bin/ingest_into_mongodb_with_schema.js").into{ ch_ingest_zpvs_script_with_schema; ch_ingest_phenotypefields_script_with_schema }

// If schemas are not supplied
Channel.fromPath("${projectDir}/bin/ingest_into_mongodb_no_schema.js").into{ ch_ingest_participants_script_no_schema; ch_ingest_zpvs_script_no_schema; ch_ingest_phenotypefields_script_no_schema }



/*--------------
  Report inputs
----------------*/
Channel.fromPath("${projectDir}/bin/report/DTable.R").set{ ch_dtable_r }
Channel.fromPath("${projectDir}/bin/report/logo.png").set{ ch_logo_png }
Channel.fromPath("${projectDir}/bin/report/report.Rmd").set{ ch_report_rmd }
Channel.fromPath("${projectDir}/bin/report/style.css").set{ ch_style_css }



/*---------------------------
  1 Check MongoDB connection
 ---------------------------*/
if(params.dry_run){
  process check_connection {
    publishDir "${params.outdir}/connection-check", mode: "copy"

    input:
    file("check_mongo_connection.js") from ch_check_mongo_connection_script

    script:
    """
    DB_HOST=\$(aws ssm get-parameter --name "${params.aws_ssm_param_clinical_cb_sql_db_host}" --region eu-west-2 | jq -r ".Parameter.Value")
    DB_NAME=\$(aws ssm get-parameter --name "${params.aws_ssm_param_clinical_cb_sql_db_name}" --region eu-west-2 | jq -r ".Parameter.Value")
    DB_PORT=\$(aws ssm get-parameter --name "${params.aws_ssm_param_clinical_cb_sql_db_port}" --region eu-west-2 | jq -r ".Parameter.Value")
    DB_USERNAME=\$(aws ssm get-parameter --name "${params.aws_ssm_param_clinical_cb_sql_db_username}" --region eu-west-2 | jq -r ".Parameter.Value")
    DB_PASSWORD=\$(aws ssm get-parameter --name "${params.aws_ssm_param_clinical_cb_sql_db_password}" --region eu-west-2 | jq -r ".Parameter.Value")

    echo "DB_HOST = \$DB_HOST"
    echo "DB_NAME = \$DB_NAME"
    echo "DB_PORT = \$DB_PORT"
    echo "DB_USERNAME = \$DB_USERNAME"
    echo "DB_PASSWORD = \$DB_PASSWORD"
    """
  }
}

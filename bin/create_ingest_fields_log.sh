#!/usr/bin/env bash
# CREATE INGEST FIELDS LOG script
# takes a collection name (collectionName), start of the original input file and after-ingestion logs and connects them into one csv file

# Eample use:
# bash bin/create_ingest_fields_log.sh -c participants -o "number_of_fields_participants" -a after_ingest_participants_number.log

# Read flags
while getopts c:o:a: flag
do
    case "${flag}" in
        c) collectionName=${OPTARG};;
        o) originalFile=${OPTARG};;
        a) afterIngestionLog=${OPTARG};;
    esac
done

searchPattern=$originalFile'*'
cat $searchPattern > $originalFile'_concat.txt'
one=$(awk '{sum=sum+$1} END{print sum}' $originalFile'_concat.txt')
two=$(cat $afterIngestionLog)
echo "$collectionName,$one,$two" > $collectionName'_ingest.csv'
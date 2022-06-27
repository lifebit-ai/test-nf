#!/usr/bin/env bash
# CREATE REMOVE FIELDS LOG script
# takes a collection name (collectionName) and after_remove logs and connects them into one csv file

# Eample use:
# bash bin/create_remove_fields_log.sh -c participants -a after_remove_participants_number.log

# Read flags
while getopts c:o:a: flag
do
    case "${flag}" in
        c) collectionName=${OPTARG};;
        a) afterRemoveLog=${OPTARG};;
    esac
done

one=$(cat $afterRemoveLog)
echo "$collectionName,$one" > $collectionName'_remove.csv'
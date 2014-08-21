#!/bin/bash

# http://stackoverflow.com/questions/6482377/bash-shell-script-check-input-argument/6482403#6482403
if [ -z "$1" -o -z "$2" ]
  then
  echo "Usage: ./install_dataset.bash public/image FOLDER"
  exit 1
fi

STATIC_IMAGE_FOLDER=$1
FOLDER=$2

find $FOLDER -regextype posix-egrep -iregex '.+\.(bmp|gif|jpg|jpeg|png|tif|tiff)' | sort | xargs shasum > $FOLDER.list
echo "[" > $FOLDER.json
IFS=$'\n' # http://tldp.org/LDP/abs/html/internalvariables.html
for IMAGE in $(cat $FOLDER.list)
  do
  IMAGE_SHA=$(echo $IMAGE | sed -r 's/([a-f0-9]{40}) +.+/\1/g')
  IMAGE_SHA_FOLDER=$(echo -n $IMAGE_SHA | head -c 2)
  IMAGE_SHA_FILE=$(echo -n $IMAGE_SHA | tail -c 38)
  IMAGE_FILE=$(echo $IMAGE | sed -r 's/[a-f0-9]{40} +(.+)/\1/g')
  IMAGE_EXTENSION=${IMAGE_FILE#*.} # http://stackoverflow.com/questions/965053/extract-filename-and-extension-in-bash
  IMAGE_URL="/image/$IMAGE_SHA_FOLDER/$IMAGE_SHA_FILE.$IMAGE_EXTENSION"
  echo ""
  echo "$IMAGE_FILE"
  echo "  mkdir -p $STATIC_IMAGE_FOLDER/$IMAGE_SHA_FOLDER"
  mkdir -p $STATIC_IMAGE_FOLDER/$IMAGE_SHA_FOLDER
  echo "  ln -sf $(readlink -f $IMAGE_FILE) $STATIC_IMAGE_FOLDER/$IMAGE_SHA_FOLDER/$IMAGE_SHA_FILE.$IMAGE_EXTENSION"
  ln -sf $(readlink -f $IMAGE_FILE) $STATIC_IMAGE_FOLDER/$IMAGE_SHA_FOLDER/$IMAGE_SHA_FILE.$IMAGE_EXTENSION # http://stackoverflow.com/questions/4045253/converting-relative-path-into-absolute-path
  # http://www.imagemagick.org/script/escape.php
  convert $IMAGE_FILE -print "{\"sha\": \"$IMAGE_SHA\", \"name\": \"%t\", \"filename\": \"$IMAGE_FILE\", \"url\": \"$IMAGE_URL\", \"width\": %w, \"height\": %h, \"comment\": \"\"}, \n" /dev/null >> $FOLDER.json
done
echo "]" >> $FOLDER.json

# http://docs.mongodb.org/manual/reference/program/mongoimport/#cmdoption--upsert
echo ""
echo "Images saved to $FOLDER.json, importing into local mongodb..."
echo "  mongoimport -d annotator -c images --upsert --upsertFields sha --type json --jsonArray --file $FOLDER.json"
echo ""
mongoimport -d annotator -c images --upsert --upsertFields sha --type json --jsonArray --file $FOLDER.json

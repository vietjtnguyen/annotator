#!/bin/bash

# http://elderlab.yorku.ca/YorkUrbanDB/
wget http://elderlab.yorku.ca/YorkUrbanDB/YorkUrbanDB.zip
unzip YorkUrbanDB.zip

# http://unix.stackexchange.com/questions/77077/how-do-i-use-pushd-and-popd-commands/77081#77081
pushd ..
./install_dataset.bash public/image datasets/YorkUrbanDB
node ./create_image_set.js datasets/YorkUrbanDB.json YorkUrbanDB
popd

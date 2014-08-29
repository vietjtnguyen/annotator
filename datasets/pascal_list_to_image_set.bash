#!/bin/bash
if [ -z "$(which underscore)" ]
  then
  echo "This script uses underscore-cli for JSON printing. You can install it with"
  echo "  npm install -g underscore-cli"
  echo ""
  echo "See https://www.npmjs.org/package/underscore-cli"
  exit 1
fi
# http://mockingeye.com/blog/2013/01/22/reading-everything-stdin-in-a-bash-script/
# if [ -z $1 ]
#   then
#   echo "Usage: ./pascal_list_to_image_set.bash list.txt > image_set_list.txt"
#   exit 1
# fi
( echo -n "["; cat $1 | perl -pe 's/.*(\d{4}_\d{6}).*\n/{"name": "\1"},/g' ; echo -n "]") | underscore print

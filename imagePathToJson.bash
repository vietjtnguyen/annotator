#!/bin/bash
echo "["
for f in $(find $1)
  do convert $f -print "{name: \"%t\", url: \"$2/%f\", width: %w, height: %h, comment: \"\"}, \n" /dev/null
done
echo "]"

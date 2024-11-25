#!/bin/zsh

OUTPUT="./dist"

function leftright() {
  TEXT_ESC=$(echo "$1$2" | sed $'s,\x1b\\[[0-9;]*[a-zA-Z],,g')
  TEXT_LEN=$(echo "$TEXT_ESC" | wc -c)
  REMAIN=$(printf ' %.0s' {1..$(($COLUMNS - $TEXT_LEN - 2))})
  echo "$1$REMAIN$2"
}

function sizeof() {
  echo "$(cat $1 | wc -c | grep -Eo "\d+")"
}

function build() {
  MINFILE=`echo $1 | sed 's/\(.*\.\)js/\1min.js/'`
  cat $1 | terser -c -m "reserved=['_','$$','$']" --module > "$OUTPUT/$MINFILE"
  cat "$OUTPUT/$MINFILE" | gzip > "$OUTPUT/$MINFILE.gz"
  MINSIZE=$(sizeof $OUTPUT/$MINFILE)
  ZIPSIZE=$(sizeof $OUTPUT/$MINFILE.gz)
  leftright "\e[37;1m$1\e[0m" "orig $(sizeof $1)   min \e[33m$MINSIZE\e[0m   gz \e[33m$ZIPSIZE\e[0m"
}

echo "\nbuilding...\n"
build index.js
build lisp.js
build server.js
build ssr.js
echo "\ndone!"

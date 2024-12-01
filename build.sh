#!/bin/zsh

OUTPUT="./dist"
COLSIZE=7
TABLETEMP=$(mktemp)
TERMTEMP=$(mktemp)

function len() {
  # strip escape chars
  TEXT_ESC=$(echo $1 | sed $'s,\x1b\\[[0-9;]*[a-zA-Z],,g')
  echo $TEXT_ESC | wc -c | grep -Eo "\d+"
}

function pad() {
  TEXT=$1
  LEN=$2
  RALIGN=$3
  TEXT_LEN=$(len $TEXT)
  REMAIN=$(printf ' %.0s' {0..$(($LEN - $TEXT_LEN))})
  if [[ -n $RALIGN ]] then;
    echo "$REMAIN$TEXT"
  else
    echo "$TEXT$REMAIN"
  fi
}

function max() {
  echo $(( $1 > $2 ? $1 : $2))
}

function leftright() {
  TEXT_LEN=$(len "$2")
  echo "$(pad $1 $(($COLUMNS - $TEXT_LEN)))$2"
}

function sizeof() {
  echo "$(cat $1 | wc -c | grep -Eo "\d+")"
}

function build() {
  MINFILE=`basename $1 | sed 's/\(.*\.\)js/\1min.js/'`
  cat $1 | terser -c "booleans_as_integers=true,passes=2" \
                  -m "reserved=['_','$','\$$','on','dom']" \
                  --module \
                  --ecma 2020 > "$OUTPUT/$MINFILE"
  cat "$OUTPUT/$MINFILE" | gzip > "$OUTPUT/$MINFILE.gz"
  MINSIZE=$(sizeof $OUTPUT/$MINFILE)
  ZIPSIZE=$(sizeof $OUTPUT/$MINFILE.gz)
  leftright "\e[37;1m$1\e[0m" "$(pad $(sizeof $1) $COLSIZE 1)$(pad "\e[33m$MINSIZE\e[0m" $COLSIZE 1)$(pad "\e[33m$ZIPSIZE\e[0m" $COLSIZE 1)" >> "$TERMTEMP"
  echo "$(pad $1 20) | $(pad $(sizeof $1) 9 1) | $(pad $MINSIZE 9 1) | $(pad $ZIPSIZE 6 1)" >> "$TABLETEMP"
}

echo "\nbuilding...\n"

leftright "file" "$(pad "orig" $COLSIZE 1)$(pad "min" $COLSIZE 1)$(pad "gz" $COLSIZE 1)"
echo $(printf '-%.0s' {0..$(($COLUMNS - 1))})
for file in $(ls src/*.js)
do
  build "$file" &
done
wait
cat "$TERMTEMP" | sort

echo "# file sizes\n" > sizes.md
echo "$(pad "file" 20) | $(pad "original" 9 1) | $(pad "minified" 9 1) | $(pad "gzip" 6 1)" >> sizes.md
echo "$(pad ":---" 20) | $(pad "---:" 9 1) | $(pad "---:" 9 1) | $(pad "---:" 6 1) " >> sizes.md
cat "$TABLETEMP" | sort >> sizes.md

echo "\ndone!"

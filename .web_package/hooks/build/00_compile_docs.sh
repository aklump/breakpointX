#!/bin/bash
#
# @file Compiles Loft Docs.
#
! test -d "$7/docs" || rm -rf "$7/docs" || hook_exception
cd "$7/documentation/" && ./core/compile.sh || hook_exception
test -f "$7/docs/index.html" || hook_exception

# Auto commit the files generated as output.
git=$(type git >/dev/null 2>&1 && which git)
if test -d $7/.git && [ "$git" ]; then
    # Note to support symlinks, we should cd first (per git).
    (cd $7/docs && git add .)
    (cd $7 && [[ -f README.md ]] && git add README.md)
    (cd $7 && [[ -f CHANGELOG.md ]] && git add CHANGELOG.md)
fi

# Point the root README images to the docs folder.
basename="breakpoint-x"
basename=${basename/-/\\-}
basename=${basename/./\\.}
eval "sed -i '' 's/(images\/$basename\.jpg)/(docs\/images\/$basename\.jpg)/g' \"$7/README.md\""

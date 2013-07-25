#!/bin/sh

if git diff --exit-code >/dev/null && git diff --cached --exit-code >/dev/null; then
    unclean="";
else
    unclean="+";
fi

version_tags=$(git tag --list 'v*' --contains HEAD)
if [ -z "$version_tags" ]; then
    version_tags="v.git-$(git rev-parse --short HEAD)$unclean"
fi

if [ "$(cat version.txt)" != "$version_tags" ]; then
    echo -n "$version_tags" > version.txt
fi

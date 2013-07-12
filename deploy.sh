#!/bin/sh

if [ "$1" = "product" ]; then
    sed -i 's/\<dev\>/product/g' app.dev.yaml > app.yaml
    exec appcfg.py update ./ --oauth2
else
    cp -a app.dev.yaml app.yaml
    exec appcfg.py update ./ --oauth2
fi

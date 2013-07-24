#!/bin/sh

if git diff --exit-code >/dev/null && git diff --cached --exit-code >/dev/null; then
    if [ "$1" = "product" ]; then
	git log -1 > product.deploy.log
	sed 's/\<dev\>/product/g' app.dev.yaml > app.yaml
	if appcfg.py update ./ --oauth2; then
	    git tag -f product
	fi
    else
	git log -1 > dev.deploy.log
	cp -a app.dev.yaml app.yaml
	if appcfg.py update ./ --oauth2; then
	    git tag -f dev
	fi
    fi
else
    echo >&2 "Please make sure all are commited."
fi

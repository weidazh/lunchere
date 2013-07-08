#!/bin/sh

export PYTHONPATH=$PYTHONPATH:~/opt/google_appengine/:~/opt/google_appengine/lib/
exec pylint lunchere.py > lunchere.py.lint.txt

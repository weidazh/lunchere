ALL: css/landing.css css/main.css templates/main.html templates/landing.html

css/main.css: css/main.less css/main-position.less css/main-style.less css/common.less

css/landing.css: css/landing.less css/common.less

css/%.css: css/%.less
	lessc $< $@

templates/%.html: templates/%.php version.txt templates/footer.inc.php
	php $< > $@


.FORCE:

version.txt: .FORCE
	sh generate-version-txt.sh

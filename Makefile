ALL: css/landing.css css/main.css templates/main.html templates/landing.html

css/main.css: css/main.less css/main-position.less css/main-style.less css/common.less

css/landing.css: css/landing.less css/common.less

css/%.css: css/%.less
	lessc $< $@

templates/main.html: templates/main.php version.txt
	php $< > $@

templates/landing.html: templates/landing.php version.txt
	php $< > $@

.FORCE:

version.txt: .FORCE
	sh generate-version-txt.sh

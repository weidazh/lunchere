ALL: css/core.css css/main.css templates/main.html

css/main.css: css/main.less css/main-position.less css/main-style.less

css/%.css: css/%.less
	lessc $< $@

templates/main.html: templates/main.php version.txt
	php $< > $@

.FORCE:

version.txt: .FORCE
	sh generate-version-txt.sh

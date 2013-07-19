ALL: css/core.css css/main.css

css/main.css: css/main.less css/main-position.less css/main-style.less

css/%.css: css/%.less
	lessc $< $@

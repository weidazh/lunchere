ALL: css/core.css css/main.css

css/%.css: css/%.less
	lessc $< $@

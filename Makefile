module_input := html/src/index.js
module_output := html/assets/js/index.js
module_output_min := html/assets/js/index.min.js

spec_input := html/src/index.test.js
spec_output := html/assets/js/index.test.js
spec_output_min := html/assets/js/index.test.min.js

fresh: clean build_all

ensure_build_js:
	mkdir -p html/assets/js

build_all: ensure_build_js build_module build_spec

build_module:
	browserify $(module_input) > $(module_output)
	uglifyjs $(module_output) > $(module_output_min)

build_spec:
	browserify $(spec_input) > $(spec_output)
	uglifyjs $(spec_output) > $(spec_output_min)

clean:
	rm -rf html/assets/js


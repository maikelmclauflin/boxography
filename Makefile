force_module_input := html/src/force/index.js
force_module_output := html/assets/js/force/index.js
force_module_output_min := html/assets/js/force/index.min.js

force_spec_input := html/src/force/index.test.js
force_spec_output := html/assets/js/force/index.test.js
force_spec_output_min := html/assets/js/force/index.test.min.js

points_module_input := html/src/points/index.js
points_module_output := html/assets/js/points/index.js
points_module_output_min := html/assets/js/points/index.min.js

points_spec_input := html/src/points/index.test.js
points_spec_output := html/assets/js/points/index.test.js
points_spec_output_min := html/assets/js/points/index.test.min.js

fresh: clean build_all

ensure_build_js:
	mkdir -p html/assets/js
	mkdir -p html/assets/js/points
	mkdir -p html/assets/js/force

build_all: ensure_build_js build_module build_spec

build_module:
	browserify $(force_module_input) > $(force_module_output)
	# uglifyjs $(force_module_output) > $(force_module_output_min)
	browserify $(points_module_input) > $(points_module_output)
	# uglifyjs $(points_module_output) > $(points_module_output_min)

build_spec:
	browserify $(force_spec_input) > $(force_spec_output)
	# uglifyjs $(force_spec_output) > $(force_spec_output_min)
	browserify $(points_spec_input) > $(points_spec_output)
	# uglifyjs $(points_spec_output) > $(points_spec_output_min)

clean:
	rm -rf html/assets/js


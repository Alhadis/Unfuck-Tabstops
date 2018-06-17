SRC    = unfuck-tabstops.js
TARGET = unfuck-tabstops.min.js

all: install lint $(TARGET)


# Compile/minify bookmarklet
$(TARGET): $(SRC)
	printf '\njavascript:void ' > $@
	uglifyjs $(SRC) --compress --mangle >> $@
	sed     -i.bak -e '1,/^javascript:void !/ s/ //;' $@
	sed  -n -i.bak -e '/[[:blank:]]/,$$p' $@
	rm   -f "$@.bak"
	node -c $@


# Check syntax of JS files
lint:
	eslint $(SRC)


# Install required dependencies
install:
	@(command -v uglifyjs 2>&1 >/dev/null) || npm install -g uglify-es
	@(command -v eslint   2>&1 >/dev/null) || npm install -g eslint


# Delete generated files
clean:
	rm -f $(TARGET)


.PHONY: clean install

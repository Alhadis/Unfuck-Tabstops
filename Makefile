SRC    = unfuck-tabstops.js
TARGET = unfuck-tabstops.min.js

all: install lint $(TARGET)


# Compile/minify bookmarklet
$(TARGET): $(SRC)
	printf javascript:void > $@.1.tmp
	npx terser \
		--compress \
		--mangle \
		--output $@.2.tmp $(SRC)
	cat $@.?.tmp > $@
	rm -f $@.?.tmp
	node -c $@


# Check syntax of JS files
lint:
	eslint $(SRC)


# Install required dependencies
install:
	@(command -v terser 2>&1 >/dev/null) || npm install -g terser
	@(command -v eslint 2>&1 >/dev/null) || npm install -g eslint


# Delete generated files
clean:
	rm -f $(TARGET) $(TARGET).?.tmp


.PHONY: clean install

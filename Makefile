BIN=node_modules/.bin

MOCHA_ARGS= --compilers js:babel-register
MOCHA_TARGET=src/**/test*.js

clean:
	rm -rf dist

build: clean
	$(BIN)/webpack
	$(BIN)/webpack --mode=build

test: lint
	NODE_ENV=test $(BIN)/mocha $(MOCHA_ARGS) $(MOCHA_TARGET) --prof

test-watch: lint
	NODE_ENV=test $(BIN)/mocha $(MOCHA_ARGS) -w $(MOCHA_TARGET) --max-old-space-size=4000 --prof

lint:
	$(BIN)/eslint src

deploy:
	$(BIN)/gulp deploy

bench:
	node runbench.js

PHONY: build clean test test-watch lint bench
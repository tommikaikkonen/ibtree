const Immutable = require('immutable');
const Benchmark = require('benchmark');
const pad = require('pad');
const random = require('lodash/random');
const range = require('ramda/src/range');

const log = function() {
    console.log(this.name);
    this.map(results => {
        console.log(pad(results.name, 30) + ': ' +
            pad(15, results.hz.toFixed(2)) + ' +/- ' + results.stats.rme.toFixed(2) + '% op/s');
    });
    console.log('\n');
};

function logOnError(event) {
    console.log('Error!');
    console.log(event);
}

const run = path => {
    const tests = require(path);

    const suite = new Benchmark.Suite(tests.name, { minSamples: 1, maxTime: 1, onError: logOnError });
    // const sizes = tests.sizes;
    const sizes = [10, 1000, 100000];
    const bench = sizes.reduce((b, size) => {
        const keys = range(0, size);
        const order = range(0, size);
        return Object.keys(tests.benchmarks).reduce((_b, name) => {
            _b.add(`${name} (${size})`, tests.benchmarks[name](keys, order));
            return _b;
        }, b);
    }, suite);

    return bench.on('complete', log).run(true);
};

run('./bench/init');
run('./bench/init_transient');
run('./bench/get');
run('./bench/delete');
run('./bench/deleteall');
run('./bench/range');

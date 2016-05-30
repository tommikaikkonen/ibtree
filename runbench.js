const Immutable = require('immutable');
const Benchmark = require('benchmark');
const pad = require('pad');
const random = require('lodash/random');
const range = require('ramda/src/range');
const sortBy = require('ramda/src/sortBy');
const toPairs = require('ramda/src/toPairs');
const commaIt = require('comma-it');
const fs = require('fs');

const sizes = [10, 1000, 100000];

const log = function() {
    'use strict';
    console.log(this.name);
    const bySize = {};
    const indent = '  ';
    function _log(str) {
        console.log(indent + str);
    }
    this.map(results => {
        const size = results.size;
        const contender = results.contender;
        if (!bySize.hasOwnProperty(size)) {
            bySize[size] = {};
        }
        const name = pad(results.name, 30, '.');
        const ops = pad(15, results.hz.toFixed(2), '.');
        const relativeErrMargin = results.stats.rme.toFixed(2);
        const resultRow = `${name}${ops} +/- ${relativeErrMargin}% op/s`;

        bySize[size][contender] = {
            result: results.hz,
            rme: results.stats.rme,
        };
    });
    sizes.forEach(size => {
        const contenders = bySize[size];
        const nameAndResultPairs = toPairs(contenders);
        const byResult = sortBy(pair => pair[1].result, nameAndResultPairs).reverse();

        const bestResult = Math.round(byResult[0][1].result);
        const bestContender = byResult[0][0];
        _log(`N=${size}:`);
        byResult.forEach((pair, i) => {
            const name = pad(pair[0], 20);
            let result = pair[1].result;
            const relativeErrMargin = pair[1].rme.toFixed(2);
            result = Math.round(result);

            const resultNum = pad(20, commaIt(result));
            const percentSlowerThanBest = ((bestResult - result) / bestResult) * 100;
            const comparison = percentSlowerThanBest === 0
                ? ''
                : `${percentSlowerThanBest.toFixed(1)}% slower than ${bestContender}`;

            _log(`${i + 1}. ${name}:${resultNum} +/- ${relativeErrMargin}% op/s, ${comparison}`);
        });
        console.log('');
    });
    console.log('\n');
};

const graphPoints = {};
function saveGraphPoints() {
    const contenders = {};
    this.map(results => {
        const contender = results.contender;
        const size = results.size;
        const x = size;
        const y = results.hz;

        if (!contenders.hasOwnProperty(contender)) {
            contenders[contender] = { points: [] };
        }
        contenders[contender].points.push([x, y]);
    });
    graphPoints[this.name] = contenders;
}

function graphPointsToCSV(benchpoints) {
    'use strict';
    const rows = [];
    for (var testName of Object.keys(benchpoints)) {
        const header = [testName].concat(sizes);
        rows.push(header);

        const contenders = benchpoints[testName];
        for (var contenderKey of Object.keys(contenders)) {
            const contender = contenders[contenderKey];
            const points = contender.points;
            const row = [contenderKey];
            points.forEach(point => {
                const y = point[1];
                row.push(y);
            });
            rows.push(row);
        }
    }

    return rows.map(row => row.join(',')).join('\n');
}

function logOnError(event) {
    console.log('Error!');
    console.log(event);
}

const run = path => {
    const tests = require(path);

    const suite = new Benchmark.Suite(tests.name, {
        minSamples: 5,
        maxTime: 10,
        onError: logOnError,
        async: false,
    });

    const bench = sizes.reduce((b, size) => {
        const keys = range(0, size);
        const order = range(0, size);
        return Object.keys(tests.benchmarks).reduce((_b, name) => {
            _b.add(`${name} (${size})`, tests.benchmarks[name](keys, order), {
                contender: name,
                size,
            });
            return _b;
        }, b);
    }, suite);

    return bench.on('complete', log).on('complete', saveGraphPoints).run(true);
};

run('./bench/init');
run('./bench/init_transient');
run('./bench/init_bulkload');
run('./bench/get');
run('./bench/delete');
run('./bench/deleteall');
run('./bench/deleteall_transient');
run('./bench/range');

const csvFile = graphPointsToCSV(graphPoints);
fs.writeFile('benchgraphpoints.csv', csvFile);

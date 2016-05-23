const sample = require('lodash/sample');
const utils = require('./utils');
const toPairs = require('ramda/src/toPairs');
const mapObjIndexed = require('ramda/src/mapObjIndexed');

const adapters = utils.adapters;

const benchmarks = {};
module.exports = {
    name: 'Get a random key from N entries',
    description: 'Cost to get a key from a map of size N',
    sizes: [100],
    benchmarks,
};

mapObjIndexed((adapter, name) => {
    benchmarks[name] = keys => {
        const obj = adapter.from(keys);
        return () => {
            const key = sample(keys);
            obj.get(key);
        };
    };
}, adapters);

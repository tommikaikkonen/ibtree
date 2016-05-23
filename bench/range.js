const random = require('lodash/random');
const utils = require('./utils');
const toPairs = require('ramda/src/toPairs');
const mapObjIndexed = require('ramda/src/mapObjIndexed');

const adapters = utils.adapters;

const benchmarks = {};
module.exports = {
    name: 'Get a random key range in order from N entries',
    description: 'Cost to get a range of keys from a map of size N',
    sizes: [100],
    benchmarks,
};

mapObjIndexed((adapter, name) => {
    benchmarks[name] = keys => {
        const obj = adapter.from(keys);
        return () => {
            const fromKey = random(0, Math.round((keys.length - 1) / 2));
            const toKey = random(fromKey, Math.round((keys.length - 1)));
            obj.between(fromKey, toKey);
        };
    };
}, adapters);

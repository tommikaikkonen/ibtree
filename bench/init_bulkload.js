'use strict';
const mapObjIndexed = require('ramda/src/mapObjIndexed');
const adapters = require('./utils').adapters;

const benchmarks = {};
module.exports = {
    name: 'Bulkload N entries from empty (transient)',
    description: 'Cost to bulkload N entries into a map with mutations',
    sizes: [100],
    benchmarks,
};

mapObjIndexed((adapter, name) => {
    benchmarks[name] = keys => () => {
        adapter.fromTransient(keys);
    };
}, adapters);

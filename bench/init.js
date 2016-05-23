'use strict';
const mapObjIndexed = require('ramda/src/mapObjIndexed');
const adapters = require('./utils').adapters;

const benchmarks = {};
module.exports = {
    name: 'Add N entries to an empty structure',
    description: 'Cost to add N entries into a map',
    sizes: [100],
    benchmarks,
};

mapObjIndexed((adapter, name) => {
    benchmarks[name] = keys => () => {
        let obj = adapter.new();
        for (let i = 0, len = keys.length; i < len; i++) {
            obj = obj.set(keys[i], i);
        }
    };
}, adapters);

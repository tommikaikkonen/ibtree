'use strict';
const mapObjIndexed = require('ramda/src/mapObjIndexed');
const adapters = require('./utils').adapters;

const benchmarks = {};
module.exports = {
    name: 'Add N entries to a non-empty structure (transient)',
    description: 'Cost to add N entries into a map with transient mutations',
    sizes: [100],
    benchmarks,
};

mapObjIndexed((adapter, name) => {
    benchmarks[name] = keys => () => {
        let obj = adapter.new().asMutable();
        for (let i = 0, len = keys.length; i < len; i++) {
            obj = obj.set(keys[i], i);
        }
        obj.asImmutable();
    };
}, adapters);

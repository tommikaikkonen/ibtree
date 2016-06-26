'use strict';
const mapObjIndexed = require('ramda/src/mapObjIndexed');
const adapters = require('./utils').adapters;

const benchmarks = {};
module.exports = {
    name: 'Delete All N Entries',
    description: 'Cost to delete all N entries from a map',
    sizes: [100],
    benchmarks,
};

mapObjIndexed((adapter, name) => {
    benchmarks[name] = keys => {
        let obj = adapter.from(keys);
        return () => {
            for (let i = 0, len = keys.length; i < len; i++) {
                obj = obj.delete(keys[i]);
            }
        };
    };
}, adapters);

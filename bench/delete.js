const sample = require('lodash/sample');
const mapObjIndexed = require('ramda/src/mapObjIndexed');
const adapters = require('./utils').adapters;

const benchmarks = {};
module.exports = {
    name: 'Delete one entry from N entries',
    description: 'Cost to delete one entry from N entries',
    sizes: [100],
    benchmarks,
};

mapObjIndexed((adapter, name) => {
    benchmarks[name] = keys => {
        const obj = adapter.from(keys);
        return () => {
            const key = sample(keys);
            obj.delete(key);
        };
    };
}, adapters);

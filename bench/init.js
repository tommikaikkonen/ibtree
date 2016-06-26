'use strict';
const Immutable = require('immutable');
const BTMap = require('../lib').BTMap;

const mapObjIndexed = require('ramda/src/mapObjIndexed');
const adapters = require('./utils').adapters;

const benchmarks = {};
module.exports = {
    name: 'Add N entries to an empty structure, one by one',
    description: 'Cost to add N entries into a map',
    sizes: [100],
    benchmarks,
};

benchmarks['Immutable.Map'] = keys => {
    return () => {
        let m = new Immutable.Map();
        for (let i = 0, len = keys.length; i < len; i++) {
            m = m.set(keys[i], i);
        }
    };
};

benchmarks['ibtree'] = keys => {
    return () => {
        let m = new BTMap();
        for (let i = 0, len = keys.length; i < len; i++) {
            m = m.set(keys[i], i);
        }
    };
};

// mapObjIndexed((adapter, name) => {
//     benchmarks[name] = keys => {
//         let obj = adapter.new();
//         return () => {
//             for (let i = 0, len = keys.length; i < len; i++) {
//                 obj = obj.set(keys[i], i);
//             }
//         };
//     };
// }, adapters);

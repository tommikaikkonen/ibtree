'use strict';
const Immutable = require('immutable');
const BTMap = require('../lib').BTMap;
const mapObjIndexed = require('ramda/src/mapObjIndexed');
const adapters = require('./utils').adapters;

const benchmarks = {};
module.exports = {
    name: 'Add N entries to a non-empty structure (transient)',
    description: 'Cost to add N entries into a map with transient mutations',
    sizes: [100],
    benchmarks,
};

benchmarks['Immutable.Map'] = keys => {
    return () => {
        const m = (new Immutable.Map()).asMutable();
        for (let i = 0, len = keys.length; i < len; i++) {
            m.set(keys[i], i);
        }
        m.asImmutable();
    };
};

benchmarks['ibtree'] = keys => {
    return () => {
        let m = new BTMap();
        m = m.asMutable();
        for (let i = 0, len = keys.length; i < len; i++) {
            m.set(keys[i], i);
        }
        m.asImmutable();
    };
};

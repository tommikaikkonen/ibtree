const BTMap = require('../lib').BTMap;
const Immutable = require('immutable');

const _from = (adapter, keys) =>
    keys.reduce((map, val, idx) =>
        map.set(val, `value${val}`), adapter.new());

function ObjectAdapter(val) {
    this.val = val;
}

ObjectAdapter.new = () => new ObjectAdapter({});
ObjectAdapter.from = _from.bind(null, ObjectAdapter);
ObjectAdapter.prototype = {
    between(fromKey, toKey) {
        const keys = this.keys();
        return keys
            .filter(key => (fromKey <= key && key <= toKey))
            .forEach(key => this.get(key));
    },

    set(key, val) {
        const copied = this.copy();
        copied[key] = val;
        return new ObjectAdapter(copied);
    },

    keys() {
        return Object.keys(this.val);
    },

    copy() {
        return Object.assign({}, this.val);
    },

    delete(key) {
        const copied = this.copy();
        delete copied[key];
        return new ObjectAdapter(copied);
    },

    get(key) {
        return this.val[key];
    },
};

function MapAdapter(val) {
    this.val = val;
}
MapAdapter.new = () => new MapAdapter(new Map());
MapAdapter.from = _from.bind(null, MapAdapter);
MapAdapter.fromTransient = keys => {
    var adapter = MapAdapter.new();
    for (var i = 0; i < keys.length; i++) {
        adapter = adapter.set(keys[i], keys[i]);
    }
    return adapter;
};

MapAdapter.prototype = {
    between(fromKey, toKey) {
        const values = [];
        for (const kv of this.val.entries()) {
            const key = kv[0];
            if (fromKey <= key && key <= toKey) {
                values.push(kv[1]);
            }
        }
        return values;
    },

    set(key, val) {
        const copied = this.copy();
        copied.set(key, val);
        return new MapAdapter(copied);
    },

    copy() {
        return new Map(this.val);
    },

    delete(key) {
        const copied = this.copy();
        copied.delete(key);
        return new MapAdapter(copied);
    },

    get(key) {
        return this.val.get(key);
    },
};

function TreeAdapter(val) {
    this.val = val;
}
TreeAdapter.new = () => new TreeAdapter(new BTMap());
TreeAdapter.from = _from.bind(null, TreeAdapter);
TreeAdapter.fromTransient = keys => {
    const adapter = TreeAdapter.new();
    adapter.val = BTMap.from(keys.map(key => [key, key]));
    return adapter;
};
TreeAdapter.prototype = {
    between(fromKey, toKey) {
        return this.val.between(fromKey, toKey);
    },

    set(key, val) {
        const copied = this.copy();
        return new TreeAdapter(copied.set(key, val));
    },

    copy() {
        return this.val;
    },

    delete(key) {
        const copied = this.copy();
        return new TreeAdapter(copied.delete(key));
    },

    get(key) {
        return this.val.get(key);
    },
};

function ImmutableAdapter(val) {
    this.val = val;
}
ImmutableAdapter.new = () => new ImmutableAdapter(Immutable.Map()); // eslint-disable-line
ImmutableAdapter.from = _from.bind(null, ImmutableAdapter);
ImmutableAdapter.fromTransient = keys => {
    const adapter = ImmutableAdapter.new();
    adapter.val.withMutations(mapObj =>
        keys.reduce((map, key) => map.set(key, key), mapObj)
    );
};
ImmutableAdapter.prototype = {
    between(fromKey, toKey) {
        return this.val.entrySeq().filter(kv => fromKey <= kv[0] && kv[0] <= toKey).toArray();
    },

    set(key, val) {
        const copied = this.copy();
        return new ImmutableAdapter(copied.set(key, val));
    },

    copy() {
        return this.val;
    },

    delete(key) {
        const copied = this.copy();
        return new ImmutableAdapter(copied.delete(key));
    },

    get(key) {
        return this.val.get(key);
    },
};

module.exports = {
    adapters: {
        // Object: ObjectAdapter,
        // Map: MapAdapter,
        BPlusTree: TreeAdapter,
        ImmutableMap: ImmutableAdapter,
    },
};

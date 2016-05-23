ibtree
===============

A performant, in-memory, immutable B+ tree data structure. 

## Features

- Implements extended ES6 Map and Set interfaces (`BTMap` and `BTSet`)
- No 3rd party dependencies
- Insertion, deletion and bulk-loading
- Supports any key types with custom comparators and key functions
- Range search
- Iteration
- Similar performance to Immutable.Map using Map operations, considerably faster range search due to the B+ tree data structure

## Benchmark

For `BTMap` is similar in performance to Immutable.Map. The range search is much faster because of the difference in data structures.

The tradeoff between Immutable.Map and `BTMap` is that `BTMap` uses more memory to store updated trees.

When the tree is updated, each affected node's keys and children (Arrays of length between 32 and 64) are shallow copied. There's 1-5 affected nodes based on the height of your tree, therefore each update creates (1-5) * 2 new arrays of length between 32 and 64, whereas Immutable.js doesn't copy as much. However, if you don't keep references to many historical versions, they should get garbage collected and shouldn't be a problem.

**These are relative, not absolute benchmarks. The benchmark implementation uses an adapter to interface with both Immutable and ibtree, which introduces a small overhead.**

```
Add N entries to an empty structure
BPlusTree (10)                :       489790.67 +/- 2.26% op/s
ImmutableMap (10)             :       123086.68 +/- 2.02% op/s
BPlusTree (1000)              :         1489.95 +/- 1.89% op/s
ImmutableMap (1000)           :         1252.36 +/- 2.08% op/s
BPlusTree (100000)            :            9.33 +/- 2.29% op/s
ImmutableMap (100000)         :            4.26 +/- 5.34% op/s


Bulkload N entries from empty (transient)
BPlusTree (10)                :       179840.55 +/- 1.72% op/s
ImmutableMap (10)             :       151030.70 +/- 1.57% op/s
BPlusTree (1000)              :        12267.07 +/- 3.14% op/s
ImmutableMap (1000)           :         6543.59 +/- 1.71% op/s
BPlusTree (100000)            :           83.79 +/- 1.06% op/s
ImmutableMap (100000)         :           11.58 +/- 7.39% op/s


Get a random key from N entries
BPlusTree (10)                :      4920979.07 +/- 1.62% op/s
ImmutableMap (10)             :      5396384.46 +/- 0.58% op/s
BPlusTree (1000)              :      3479077.10 +/- 0.83% op/s
ImmutableMap (1000)           :      4751287.29 +/- 0.68% op/s
BPlusTree (100000)            :      1961553.54 +/- 0.78% op/s
ImmutableMap (100000)         :      1259415.57 +/- 0.54% op/s


Delete one entry from N entries
BPlusTree (10)                :      1239863.55 +/- 0.54% op/s
ImmutableMap (10)             :      1885839.47 +/- 0.68% op/s
BPlusTree (1000)              :       786251.70 +/- 2.50% op/s
ImmutableMap (1000)           :       926212.27 +/- 2.70% op/s
BPlusTree (100000)            :       533927.56 +/- 2.96% op/s
ImmutableMap (100000)         :       475102.98 +/- 1.49% op/s


Delete All N Entries
BPlusTree (10)                :      4366932.55 +/- 0.57% op/s
ImmutableMap (10)             :      4244500.38 +/- 1.55% op/s
BPlusTree (1000)              :        45030.32 +/- 2.01% op/s
ImmutableMap (1000)           :        47361.59 +/- 2.94% op/s
BPlusTree (100000)            :          466.41 +/- 1.88% op/s
ImmutableMap (100000)         :          486.25 +/- 0.94% op/s


Get a random key range in order from N entries
BPlusTree (10)                :       354611.75 +/- 4.97% op/s
ImmutableMap (10)             :       178278.87 +/- 4.29% op/s
BPlusTree (1000)              :       335082.96 +/- 4.93% op/s
ImmutableMap (1000)           :         8885.40 +/- 0.67% op/s
BPlusTree (100000)            :       291932.93 +/- 4.45% op/s
ImmutableMap (100000)         :           69.72 +/- 1.43% op/s
```

## API

Two classes are exposed: `BTMap` and `BTSet`. 

### new BTMap(Object opts)

Returns a new, empty BTMap. Override defaults with `opts` object. Defaults are:

```javascript
{
    // A function that extracts a key to use for comparisons.
    // If you're using `tree.set(key, value)`, the key is extracted
    // from `key`. If you're using `tree.add(value)`, it's
    // extracted from `value`.
    extractor: x => x,

    // a and b are the keys extracted with `extractor`.
    // This is close to the normal JavaScript comparison.
    comparator: (a, b) => a === b ? 0 : a < b ? -1 : 1,
}
```

### new BTSet(Object opts)

Works the same as `new BTMap()` above.

### Classmethod BTMap.from(Array<Array<*>> entries[, Object opts])

Returns a new BTMap with data from a sorted array of `[key, value]` pairs. Uses a bulkloading algorithm internally, which is significantly faster than inserting values individually. `opts` works the same  as to `new BTMap(opts)`. `entries` must be an array of key-value pairs. Example:

```javascript
const map = BTMap.from([
    ['key1', 'value1'],
    ['key2', 'value2'],
]);

map.get('key1');
// 'value1'

map.get('key2');
// 'value2'
```


### Classmethod BTSet.from(Array<*> values[, Object opts])

Works the same as `BTMap.from`, except the first argument is a list of values instead of key-value pairs.

```javascript
const btree = BTSet.from([
    'value1',
    'value2',
]);

btree.has('value1');
// true
btree.get('value1');
// 'value1'

btree.has('value2');
// true
```

## BTMap instance methods

- `delete(key)` and `set(key, value)` return a new, updated BTMap instance instead of mutating the current one.
- `clear` returns an empty `BTMap`.

These work the same as native Map:

- `entries()`
- `values()`
- `keys()`
- `get(key)`
- `has(key)`
- `[Symbol.iterator]()`

## BTSet instance methods

- `delete(value)` and `add(value)` return a new, updated BTSet instance instead of mutating the current one.
- `clear` returns an empty `BTSet`.

These work the same as native Set:

- `entries()`
- `values()`
- `keys()`
- `has(value)`
- `[Symbol.iterator]()`

### Range Search Methods

The key benefit of B+ trees is the fast range search. Range searches extend the `entries`, `values` and `keys` instance methods to accept two arguments that specify the range boundaries.

- `entries([any fromKey, any toKey])` (also alias `entryRange`)
- `values([any fromKey, any toKey])` (also alias `valueRange`)
- `keys([any fromKey, any toKey])` (also alias `keyRange`)

If these functions are called with zero arguments, they iterate through all the elements in order, just like the corresponding native Map and Set methods.

These additional methods are also supported:

- `range`, which is an alias for `entries` in BTMap and `values` in BTSet.

All these methods return an iterator for elements whose keys satisfy `fromKey <= key <= toKey`. The order of iteration is decided by comparing `fromKey` and `toKey`. If `fromKey` > `toKey` according to the instance's comparator, the iteration will be performed in reverse.

```javascript
const entries = [
    [1, 'one'],
    [2, 'two'],
    [3, 'three'],
    [4, 'four'],
    [5, 'five'],
    [6, 'six'],
]

const map = BTMap.from(entries);

Array.from(map.values(2, 5));
// ['two', 'three', 'four', 'five']

// Reverse works by switching the argument position
Array.from(map.values(5, 2));
// ['five', 'four', 'three', 'two']
```


### BTMap instance properties

- `size`: Returns number of values in the map

### BTSet instance properties

- `size`: Returns number of values in the set


## License

MIT. See `LICENSE`

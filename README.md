ibtree
===============

A performant, in-memory, immutable B+ tree data structure.

## Features

- Implements extended ES6 Map and Set interfaces (`BTMap` and `BTSet`)
- No 3rd party dependencies
- Insertion, deletion and bulk-loading
- Batched mutations
- Supports any key types with custom comparators and key functions
- Range search
- Iteration
- Similar performance to Immutable.Map using Map operations, considerably faster range search due to the B+ tree data structure

## Installation

```bash
npm install ibtree --save
```

## Getting Started

### BTMap

```javascript
import { BTMap } from 'ibtree';

let map = BTMap.from([
    [1, 'one'],
    [2, 'two'],
    [3, 'three'],
]);

map = map.set(4, 'four');

map.has(1)
// true
map.get(1)
// 'one'

Array.from(map.values())
// ['one', 'two', 'three', 'four']

// Range searches use the values/entries/keys API with
// arguments to specify boundaries.
Array.from(map.values(2, 3));
// ['two', 'three']
Array.from(map.values(3, 2));
// ['three', 'two']

map = map.withMutations(m => {
    m.set(5, 'five').set(6, 'six').set(7, 'seven');
});

Array.from(map.values())
// ['one', 'two', 'three', 'four', 'five', 'six', 'seven']
```

### BTSet

```javascript
import { BTSet } from 'ibtree';

let set = BTSet.from([1, 2, 3]);

set.has(1)
// true
set.has(0)
// false
set = set.add(0);
set.has(0)
// true

Array.from(set.values())
// [0, 1, 2, 3]

Array.from(map.values(2, 3));
// [2, 3]
 
// Reverse range search when first argument is larger than the second.
Array.from(map.values(2, -10));
// [2, 1, 0]
```

## Benchmark

`BTMap` is similar in performance to Immutable.Map. The range search is much faster because of the difference in data structures.

The tradeoff between Immutable.Map and `BTMap` is that `BTMap` uses more memory to store updated trees.

When the tree is updated, each affected node's keys and children (Arrays of length between 32 and 64) are shallow copied. There's 1-5 affected nodes based on the height of your tree, therefore each update creates (1-5) * 2 new arrays of length between 32 and 64, whereas Immutable.js doesn't copy as much. However, if you don't keep references to many historical versions, they should get garbage collected and shouldn't be a problem.

### Summary

- On additions, `ibtree` fares better than `Immutable.Map` on small and large N (10 and 100000), `Immutable.Map` is faster on mid-size (1000).
- On deletions, `ibtree` is ~50% slower than `Immutable.Map`.
- On single key search, `ibtree` is slower on a mid-size N (1000) but faster on a larger N (100000) than `Immutable.Map`.
- On range search, `ibtree` is considerably faster than `Immutable.Map`.

### Detailed Results

**These are relative, not absolute benchmarks. The benchmark implementation uses an adapter to interface with both Immutable and ibtree, which introduces a small overhead.**

```
Add N entries to an empty structure
  N=10:
  1. ibtree              :          421 869,00 +/- 2.88% op/s,
  2. Immutable.Map       :          110 444,00 +/- 3.09% op/s, 73.8% slower than ibtree

  N=1000:
  1. ibtree              :            1 156,00 +/- 3.59% op/s,
  2. Immutable.Map       :            1 114,00 +/- 2.79% op/s, 3.6% slower than ibtree

  N=100000:
  1. ibtree              :                7,00 +/- 8.39% op/s,
  2. Immutable.Map       :                4,00 +/- 3.51% op/s, 42.9% slower than ibtree



Add N entries to a non-empty structure (transient)
  N=10:
  1. ibtree              :          466 782,00 +/- 0.76% op/s,
  2. Immutable.Map       :          155 428,00 +/- 1.24% op/s, 66.7% slower than ibtree

  N=1000:
  1. Immutable.Map       :            6 423,00 +/- 0.86% op/s,
  2. ibtree              :            1 578,00 +/- 3.13% op/s, 75.4% slower than Immutable.Map

  N=100000:
  1. ibtree              :               13,00 +/- 1.56% op/s,
  2. Immutable.Map       :               10,00 +/- 7.70% op/s, 23.1% slower than ibtree



Bulkload N entries from empty (transient)
  N=10:
  1. Immutable.Map       :          151 434,00 +/- 0.93% op/s,
  2. ibtree              :          150 663,00 +/- 6.91% op/s, 0.5% slower than Immutable.Map

  N=1000:
  1. Immutable.Map       :            6 208,00 +/- 0.97% op/s,
  2. ibtree              :            5 512,00 +/- 1.60% op/s, 11.2% slower than Immutable.Map

  N=100000:
  1. ibtree              :               45,00 +/- 0.82% op/s,
  2. Immutable.Map       :               10,00 +/- 7.43% op/s, 77.8% slower than ibtree



Get a random key from N entries
  N=10:
  1. Immutable.Map       :        5 081 087,00 +/- 1.88% op/s,
  2. ibtree              :        4 652 828,00 +/- 2.13% op/s, 8.4% slower than Immutable.Map

  N=1000:
  1. Immutable.Map       :        4 670 681,00 +/- 2.12% op/s,
  2. ibtree              :        2 909 412,00 +/- 1.62% op/s, 37.7% slower than Immutable.Map

  N=100000:
  1. ibtree              :        1 404 300,00 +/- 2.37% op/s,
  2. Immutable.Map       :        1 006 802,00 +/- 4.51% op/s, 28.3% slower than ibtree



Delete one entry from N entries
  N=10:
  1. Immutable.Map       :        1 620 353,00 +/- 1.77% op/s,
  2. ibtree              :          642 680,00 +/- 3.95% op/s, 60.3% slower than Immutable.Map

  N=1000:
  1. Immutable.Map       :          837 346,00 +/- 1.00% op/s,
  2. ibtree              :          420 102,00 +/- 2.67% op/s, 49.8% slower than Immutable.Map

  N=100000:
  1. Immutable.Map       :          418 477,00 +/- 1.68% op/s,
  2. ibtree              :          317 902,00 +/- 2.49% op/s, 24.0% slower than Immutable.Map



Delete All N Entries
  N=10:
  1. Immutable.Map       :        4 196 670,00 +/- 0.76% op/s,
  2. ibtree              :        2 420 761,00 +/- 1.72% op/s, 42.3% slower than Immutable.Map

  N=1000:
  1. Immutable.Map       :           45 432,00 +/- 0.93% op/s,
  2. ibtree              :           25 508,00 +/- 1.46% op/s, 43.9% slower than Immutable.Map

  N=100000:
  1. Immutable.Map       :              433,00 +/- 2.53% op/s,
  2. ibtree              :              254,00 +/- 0.96% op/s, 41.3% slower than Immutable.Map



Delete All N Entries (transient)
  N=10:
  1. Immutable.Map       :        4 951 169,00 +/- 4.10% op/s,
  2. ibtree              :        2 363 744,00 +/- 1.12% op/s, 52.3% slower than Immutable.Map

  N=1000:
  1. Immutable.Map       :           63 367,00 +/- 2.62% op/s,
  2. ibtree              :           27 575,00 +/- 4.21% op/s, 56.5% slower than Immutable.Map

  N=100000:
  1. Immutable.Map       :              564,00 +/- 0.93% op/s,
  2. ibtree              :              275,00 +/- 1.78% op/s, 51.2% slower than Immutable.Map



Get a random key range in order from N entries
  N=10:
  1. ibtree              :          314 549,00 +/- 6.00% op/s,
  2. Immutable.Map       :          172 788,00 +/- 5.14% op/s, 45.1% slower than ibtree

  N=1000:
  1. ibtree              :          288 446,00 +/- 5.25% op/s,
  2. Immutable.Map       :            7 632,00 +/- 2.30% op/s, 97.4% slower than ibtree

  N=100000:
  1. ibtree              :          239 099,00 +/- 5.02% op/s,
  2. Immutable.Map       :               60,00 +/- 2.99% op/s, 100.0% slower than ibtree
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

### BTMap.from(Array&lt;Array&lt;*&gt;&gt; entries[, Object opts])

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

### BTMap Instance Methods

- `delete(key)` and `set(key, value)` return a new, updated BTMap instance instead of mutating the current one.
- `clear` returns an empty `BTMap`.
- `withMutations(fn)` calls `fn` with a mutable version of the BTMap. Any methods called inside `fn` on the mutable version will be applied mutatively. Returns an immutable version of the tree.
- `asMutable` returns a mutable version of the BTMap.
- `asImmutable` returns an immutable version of the BTMap.

These work the same as native Map:

- `entries()`
- `values()`
- `keys()`
- `get(key)`
- `has(key)`
- `[Symbol.iterator]()`

### BTMap instance properties

- `size`: Returns number of values in the map


### new BTSet(Object opts)

Works the same as `new BTMap()`.

### BTSet.from(Array<*> values[, Object opts])

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

### BTSet instance methods

- `delete(value)` and `add(value)` return a new, updated BTSet instance instead of mutating the current one.
- `clear` returns an empty `BTSet`.
- `withMutations(fn)` calls `fn` with a mutable version of the BTSet. Any methods called inside `fn` on the mutable version will be applied mutatively. Returns an immutable version of the tree.
- `asMutable` returns a mutable version of the BTSet.
- `asImmutable` returns an immutable version of the BTSet.

These work the same as native Set:

- `entries()`
- `values()`
- `keys()`
- `has(value)`
- `[Symbol.iterator]()`

### BTSet instance properties

- `size`: Returns number of values in the set


## Range Search Methods for BTSet and BTMap

The key benefit of B+ trees is the fast range search. Range searches extend the `entries`, `values` and `keys` instance methods to accept a specification for the range boundaries that specify the range boundaries.

There are two ways to specify the boundaries -- an object specification or to pass `from` and `to` keys as arguments.

The object specification looks like this:

```javascript
tree.entries({
  from: 5, // required
  to: 10, // required
  fromInclusive: true, // optional, default: true
  toInclusive: false, // optional, default: true
});
```

The two-key specification looks like this:

```javascript
tree.entries(20, 50);
```

and is equivalent to

```javascript
tree.entries({
  from: 20, // required
  to: 50, // required
  // fromInclusive defaults to true
  // toInclusive defaults to true
});
```

- `entries([any fromKeyOrRangeSpec[, any toKey]])` (also alias `entryRange`)
- `values([any fromKeyOrRangeSpec[, any toKey]])` (also alias `valueRange`)
- `keys([any fromKeyOrRangeSpec[, any toKey]])` (also alias `keyRange`)

If these functions are called with zero arguments, they iterate through all the elements in order, just like the corresponding native Map and Set methods.

These additional methods are also supported:

- `range`, which is an alias for `entries` in BTMap and `values` in BTSet.

The order of iteration is decided by comparing `fromKey` and `toKey`. If `fromKey` > `toKey` according to the instance's comparator, the iteration will be performed in reverse.

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


## License

MIT. See `LICENSE`

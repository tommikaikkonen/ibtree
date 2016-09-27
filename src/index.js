import binarySearch from './binarysearch';
import { Leaf, InternalNode } from './nodes';
import Path from './path';
import {
    fastMap,
    getEmptyIterator,
    tail,
    boundedChunk,
    extend,
    makeOwnerID,
    tagOwnerID,
    makeRef,
    isSet,
    normalizeRangeSpec,
} from './utils';
import {
    ORDER,
    MIN_ROOT_CHILDREN,
    SHIFT_LEN,
    LEAF_MIN_CHILDREN,
    LEAF_MAX_CHILDREN,
    INTERNAL_MIN_CHILDREN,
    INTERNAL_MAX_CHILDREN,
    ITERATOR_PROPNAME,
} from './constants';

const binSearch = binarySearch.eq;

const NOT_FOUND = {};


export const defaultComparator = (a, b) => // eslint-disable-line no-confusing-arrow
    a === b // eslint-disable-line no-nested-ternary
        ? 0
        : a < b
            ? -1
            : 1;


// Iterator extraction funcs

const extractValue = (leaf, idx) => leaf.children[idx];
const extractKey = (leaf, idx) => leaf.keys[idx];
const extractEntry = (leaf, idx) => [extractKey(leaf, idx), extractValue(leaf, idx)];


export function BPlusTree(_opts) {
    const opts = _opts || {};
    this.order = ORDER;

    // Used to decide whether @@iterator returns
    // values or entries.
    this.isSet = opts.isSet === undefined ? false : opts.isSet;

    this.extractor = opts.extractor; // May be undefined on purpose.
    this.comparator = opts.comparator || defaultComparator;

    this.root = opts.root || new Leaf({ order: this.order });
    this.size = opts.size || 0;
    this.height = opts.height || 0;
    this.ownerID = opts.ownerID;
}

extend(BPlusTree.prototype, {
    has(key) {
        return this.search(this.comparator, key) !== NOT_FOUND;
    },

    add(value) {
        return this.set(value, value);
    },

    get(key) {
        const val = this.search(this.comparator, key);
        return val === NOT_FOUND
            ? undefined
            : val;
    },

    clear() {
        return new this.constructor({
            comparator: this.comparator,
            extractor: this.extractor,
        });
    },

    set(key, value) {
        const cmp = this.comparator;
        const extractedKey = this.extractor
            ? this.extractor(key)
            : key;

        const didChange = makeRef(false);
        const result = this.root.insert(cmp, this.ownerID, didChange, extractedKey, value);

        if (!isSet(didChange)) return this;

        let newRoot;
        let rootSplit = false;
        const canMutate = !!this.ownerID;

        // Root was split
        if (result.length === 3) {
            rootSplit = true;
            const splitArr = result;
            const medianKey = splitArr[0];
            const splitChild = splitArr[1];
            const newChild = splitArr[2];

            const newRootKeys = tagOwnerID([medianKey], this.ownerID);
            const newRootChildren = tagOwnerID([splitChild, newChild], this.ownerID);

            newRoot = new InternalNode({
                order: this.order,
                keys: newRootKeys,
                children: newRootChildren,
            });
        } else {
            newRoot = result;
        }

        const newHeight = rootSplit ? this.height + 1 : this.height;
        const newSize = this.size + 1;

        if (canMutate) {
            this.height = newHeight;
            this.size = newSize;
            this.root = newRoot;
            this._didAlter = true;
            return this;
        }
        return new this.constructor({
            extractor: this.extractor,
            comparator: this.comparator,
            root: newRoot,
            height: newHeight,
            size: newSize,
            ownerID: this.ownerID,
        });
    },

    delete(key) {
        const didChange = makeRef(false);
        let newRoot = this.root.delete(
            this.comparator,
            this.ownerID,
            didChange,
            key
        );

        if (!isSet(didChange)) return this;

        let rootMerged = false;
        if (newRoot.size < MIN_ROOT_CHILDREN) {
            const isLeaf = newRoot.constructor === Leaf;
            if (!isLeaf) {
                // Since the minimum number of children in
                // the root is 2, the root must have a single
                // child.
                newRoot = newRoot.children[0];
                rootMerged = true;
            }
            // If the root is a leaf, it can be empty.
        }

        const canMutate = !!this.ownerID;

        let newTree;
        const newHeight = rootMerged ? this.height - 1 : this.height;
        const newSize = this.size - 1;

        if (canMutate) {
            newTree = this;
            this.root = newRoot;
            this.height = newHeight;
            this.size = newSize;
            this._didAlter = true;
        } else {
            newTree = new this.constructor({
                comparator: this.comparator,
                extractor: this.extractor,
                root: newRoot,
                height: newHeight,
                size: newSize,
                ownerID: this.ownerID,
            });
        }
        return newTree;
    },

    asMutable() {
        return this.ownerID
            ? this
            : new this.constructor({
                comparator: this.comparator,
                extractor: this.extractor,
                root: this.root,
                height: this.height,
                size: this.size,
                ownerID: makeOwnerID(),
            });
    },

    asImmutable() {
        return this.ownerID
            ? new this.constructor({
                comparator: this.comparator,
                extractor: this.extractor,
                root: this.root,
                height: this.height,
                size: this.size,
            })
            : this;
    },

    withMutations(fn) {
        const mutable = this.asMutable();
        fn(mutable);
        return mutable._didAlter ? mutable.asImmutable() : this;
    },

    _baseBetween(extractor, _rangeSpec) {
        if (this.size === 0) return getEmptyIterator();

        const rangeSpec = normalizeRangeSpec(_rangeSpec);

        const fromKey = this.extractor
            ? this.extractor(rangeSpec.from)
            : rangeSpec.from;

        const toKey = this.extractor
            ? this.extractor(rangeSpec.to)
            : rangeSpec.to;

        const isReverse = this.comparator(fromKey, toKey) > 0;

        const fromIsRight = isReverse;
        const toIsRight = !fromIsRight;

        const fromPath = this.findPath(fromKey, fromIsRight, rangeSpec.fromInclusive);
        const toPath = this.findPath(toKey, toIsRight, rangeSpec.toInclusive);


        if (fromPath === null || toPath === null) {
            return getEmptyIterator();
        }

        // Example: range from 0 to 1, both exclusive bounds.
        // fromPath will point to 1, toPath to 0, which means
        // we should return an empty iterator.
        //
        // In other words, the sort order of the from and to
        // arguments must match the sort order of the paths.
        const pathCmp = fromPath.compareTo(toPath);
        const gotNegativeRange = pathCmp !== 0 && pathCmp > 0 === !isReverse;
        if (gotNegativeRange) return getEmptyIterator();

        return this._iteratorFromTo(
            extractor,
            fromPath,
            toPath,
            isReverse
        );
    },

    /**
     * Returns the internal and leaf nodes
     * on the path from root to value.
     *
     * @param  {Path} path
     * @return {Array[Node]}
     */
    _pathNodes(path) {
        const nodes = new Array(path.length);

        let curr = this.root;
        for (let i = 0; i < path.length; i++) {
            nodes[i] = curr;
            curr = curr.children[path.get(i)];
        }

        return nodes;
    },

    _nextPath(path) {
        const nodes = this._pathNodes(path);
        let level = nodes.length - 1;

        // Simple case: leaf index can be incremented.
        if (path.get(level) < nodes[level].children.length - 1) {
            return path.increment(level);
        }

        level--;
        // Go through the node path starting from the lowest internal node and
        // find the first node we can increment a key for.
        while (level >= 0 && path.get(level) === nodes[level].children.length - 1) level--;
        // All nodes were at their maximum key
        if (level < 0) return null;
        return path.increment(level);
    },

    _prevPath(path) {
        // Leftmost path - can't decrement.
        if (path.equals(Path.EMPTY_PATH)) return null;

        const nodes = this._pathNodes(path);

        let level = path.length - 1;
        while (path.get(level) === 0) level--;

        let newPath = path.set(level, path.get(level) - 1);

        // Set all the lower keys to their
        // maximum value.
        let curr = nodes[level].children[newPath.get(level)];
        level++;
        for (; level < path.length; level++) {
            const childLen = curr.children.length;
            newPath = newPath.set(level, childLen - 1);
            curr = curr.children[childLen - 1];
        }
        return newPath;
    },

    _iterateAllWithExtractFn(extractFn) {
        if (this.size === 0) return getEmptyIterator();

        return this._iteratorFromTo(
            extractFn,
            this._getLeftmostPath(),
            this._getRightmostPath()
        );
    },

    _getLeafFromPath(path) {
        const level = this.height;

        let currLevel = 0;
        let currNode = this.root;

        while (currLevel !== level) {
            currNode = currNode.children[path.get(currLevel++)];
        }
        return currNode;
    },

    _getRightmostPath() {
        if (this.size === 0) return null;

        const keypath = [];
        let curr = this.root;
        let currLevel = 0;
        const leafLevel = this.height;

        while (currLevel !== leafLevel + 1) {
            const idx = curr.children.length - 1;
            keypath.push(idx);
            curr = curr.children[idx];
            currLevel++;
        }
        return Path.from(keypath);
    },

    _getLeftmostPath() {
        if (this.size === 0) {
            return null;
        }

        return new Path(SHIFT_LEN, this.height + 1);
    },

    _iteratorFromTo(extractFn, fromPath, toPath, isReverse) {
        const getPathSuccessor = isReverse
            ? this._prevPath.bind(this)
            : this._nextPath.bind(this);

        const leafLevel = this.height;

        let currPath = fromPath;

        // Most of the time we're just getting the next
        // value from a leaf, so it makes sense to cache
        // the leaf instead of looking up the successor
        // path each time.
        let leafCacheRef;
        let done = false;
        const iterator = {
            next: () => {
                const pathsEq = currPath !== null && currPath.equals(toPath);
                if (currPath !== null && (!pathsEq || !done)) {
                    const valIdx = currPath.get(leafLevel);
                    const leaf = leafCacheRef || this._getLeafFromPath(currPath);
                    if (!pathsEq) {
                        if (isReverse && valIdx > 0) {
                            // Can decrement leaf index
                            currPath = currPath.decrement(leafLevel);
                        } else if (!isReverse && valIdx < leaf.children.length - 1) {
                            // Can increment leaf idx
                            currPath = currPath.increment(leafLevel);
                        } else {
                            currPath = getPathSuccessor(currPath);
                            leafCacheRef = undefined;
                        }
                    } else {
                        done = true;
                    }

                    const value = extractFn(leaf, valIdx);

                    return {
                        value,
                    };
                }

                return {
                    done: true,
                };
            },
        };

        iterator[ITERATOR_PROPNAME] = () => iterator;

        return iterator;
    },

    findPath(key, fromRight, isInclusive) {
        if (this.size === 0) return null;

        const cmp = this.comparator;

        let curr = this.root;
        const numAccessesToReachLeaf = this.height;

        // Path needs one more value (which key to look up in leaf)
        const keypath = new Array(numAccessesToReachLeaf + 1);

        let i = 0;
        let prev = curr;
        for (; i < numAccessesToReachLeaf; i++) {
            const idx = curr.childIdxForKey(cmp, key);
            keypath[i] = idx;
            prev = curr;
            curr = curr.children[idx];
        }

        const parent = prev;

        const searchFuncName = (fromRight ? 'lt' : 'gt') + (isInclusive ? 'e' : '');
        const searchFunc = binarySearch[searchFuncName];

        // curr should be a leaf now.
        const idx = searchFunc(curr.keys, key, cmp);

        if (idx === curr.keys.length) {
            if (!fromRight) {
                // The key we're looking for could be in the right leaf.
                keypath[i - 1]++;

                const hasRightLeaf = keypath[i - 1] < parent.children.length;
                if (!hasRightLeaf) return null;
                curr = parent.children[keypath[i - 1]];
                if (curr.keys[0] >= key) {
                    keypath[i] = 0;
                } else {
                    // out of bounds.
                    return null;
                }
            } else {
                keypath[i] = idx - 1;
            }
        } else if (idx === -1) {
            if (fromRight) {
                // the key we're looking for could be in the left leaf.
                keypath[i - 1]--;

                const hasLeftLeaf = keypath[i - 1] >= 0;
                if (!hasLeftLeaf) return null;

                curr = parent.children[keypath[i - 1]];
                if (curr.keys[curr.keys.length - 1] <= key) {
                    keypath[i] = curr.keys.length - 1;
                } else {
                    // out of bounds.
                    return null;
                }
            } else {
                keypath[i] = 0;
            }
        } else {
            keypath[i] = idx;
        }

        return Path.from(keypath);
    },

    findLeaf(cmp, key) {
        let curr = this.root;
        const numAccessesToReachLeaf = this.height;
        for (let i = 0; i < numAccessesToReachLeaf; i++) {
            const idx = curr.childIdxForKey(cmp, key);
            curr = curr.children[idx];
        }

        return curr;
    },

    search(cmp, key) {
        const extractedKey = this.extractor
            ? this.extractor(key)
            : key;

        const leaf = this.findLeaf(cmp, extractedKey);
        const idx = binSearch(leaf.keys, extractedKey, cmp);
        if (idx === -1) {
            return NOT_FOUND;
        }

        return leaf.children[idx];
    },

    visit(fn) {
        const queue = [this.root];
        while (queue.length) {
            const curr = queue.shift();
            fn(curr);
            if (curr.constructor !== Leaf && curr.children) {
                queue.push(...curr.children);
            }
        }
    },
});

const makeIteratorMethod = extractor =>
    function getRangeIterator() {
        if (arguments.length === 0) {
            return this._iterateAllWithExtractFn(extractor);
        } else if (arguments.length === 1) {
            const spec = arguments[0];
            return this._baseBetween(
                extractor,
                spec
            );
        }

        const spec = {
            from: arguments[0],
            to: arguments[1],
        };

        return this._baseBetween(extractor, spec);
    };


BPlusTree.prototype.values = makeIteratorMethod(extractValue);
BPlusTree.prototype.valueRange = BPlusTree.prototype.values;
BPlusTree.prototype.entries = makeIteratorMethod(extractEntry);
BPlusTree.prototype.entryRange = BPlusTree.prototype.entries;
BPlusTree.prototype.keys = makeIteratorMethod(extractKey);
BPlusTree.prototype.keyRange = BPlusTree.prototype.keys;


function fromSortedBase(arr, _opts, isPairs) {
    const opts = _opts || {};

    const order = ORDER;

    // For leftmost nodes, we don't take a key
    // to their parent. That means the parent
    // could have one too few children, if it's
    // already at minimum. This adjusts for that.
    const MIN_ADJUSTMENT = 1;

    const minPageLen = LEAF_MIN_CHILDREN + MIN_ADJUSTMENT;
    const maxPageLen = LEAF_MAX_CHILDREN;

    const minNodeChildren = INTERNAL_MIN_CHILDREN;
    const maxNodeChildren = INTERNAL_MAX_CHILDREN;

    const pages = boundedChunk(minPageLen, maxPageLen, arr);

    const leafs = fastMap(page => {
        let leafKeys;
        if (isPairs) {
            leafKeys = fastMap(item =>
                opts.extractor
                    ? opts.extractor(item[0])
                    : item[0],
                page
            );
        } else {
            leafKeys = opts.extractor
                ? fastMap(opts.extractor, page)
                : page;
        }

        const leafValues = isPairs
            ? fastMap(item => item[1], page)
            : page;

        return new Leaf({
            order,
            keys: leafKeys,
            children: leafValues,
        });
    }, pages);

    let newHeight = 0;
    let newRoot = null;
    let leafsProcessed = false;
    if (leafs.length === 1) {
        newRoot = leafs[0];
    } else {
        let currLevel = leafs;


        while (currLevel.length > 1) {
            const chunked = boundedChunk(
                minNodeChildren + MIN_ADJUSTMENT,
                maxNodeChildren,
                currLevel
            );
            let firstInChunk = true;
            const nodes = fastMap(chunk => { // eslint-disable-line
                // For leafs, we use the first key as the key
                // for the whole chunk.
                // For internal nodes, we move the first
                // key up a level.
                const operation = leafsProcessed
                    ? child => {
                        const _head = child.keys[0];
                        child.keys = tail(null, child.keys); // eslint-disable-line
                        return _head;
                    }
                    : child => child.keys[0];

                // For the left-most nodes, we don't
                // take a key from its children.
                const operateOn = firstInChunk
                    ? tail(null, chunk)
                    : chunk;

                const newKeys = fastMap(operation, operateOn);

                firstInChunk = false;
                return new InternalNode({
                    order,
                    keys: newKeys,
                    children: chunk,
                });
            }, chunked);

            if (nodes.length === 0) break;
            currLevel = nodes;
            leafsProcessed = true;
            newHeight++;
        }

        newRoot = currLevel[0];
    }

    const _constructor = this;
    return new _constructor(extend({}, opts, {
        root: newRoot,
        size: arr.length,
        height: newHeight,
    }));
}

function fromSortedPairs(arr, opts) {
    return fromSortedBase.call(this, arr, opts, true);
}

function fromSortedValues(arr, opts) {
    return fromSortedBase.call(this, arr, opts, false);
}

BPlusTree.from = fromSortedPairs;

BPlusTree.prototype[ITERATOR_PROPNAME] = function iterator() {
    return this.isSet
        ? this.values()
        : this.entries();
};

export const BTMap = BPlusTree;

export function BTSet(_opts) {
    const opts = _opts || {};
    opts.isSet = true;
    BPlusTree.call(this, opts);
}

BTSet.from = fromSortedValues;

BTSet.prototype = BPlusTree.prototype;

export default BTMap;

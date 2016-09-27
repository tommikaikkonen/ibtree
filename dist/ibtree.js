(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("ibtree", [], factory);
	else if(typeof exports === 'object')
		exports["ibtree"] = factory();
	else
		root["ibtree"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.BTMap = exports.defaultComparator = undefined;
	exports.BPlusTree = BPlusTree;
	exports.BTSet = BTSet;
	
	var _binarysearch = __webpack_require__(1);
	
	var _binarysearch2 = _interopRequireDefault(_binarysearch);
	
	var _nodes = __webpack_require__(2);
	
	var _path = __webpack_require__(5);
	
	var _path2 = _interopRequireDefault(_path);
	
	var _utils = __webpack_require__(4);
	
	var _constants = __webpack_require__(3);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
	
	var binSearch = _binarysearch2.default.eq;
	
	var NOT_FOUND = {};
	
	var defaultComparator = exports.defaultComparator = function defaultComparator(a, b) {
	    return (// eslint-disable-line no-confusing-arrow
	        a === b // eslint-disable-line no-nested-ternary
	        ? 0 : a < b ? -1 : 1
	    );
	};
	
	// Iterator extraction funcs
	
	var extractValue = function extractValue(leaf, idx) {
	    return leaf.children[idx];
	};
	var extractKey = function extractKey(leaf, idx) {
	    return leaf.keys[idx];
	};
	var extractEntry = function extractEntry(leaf, idx) {
	    return [extractKey(leaf, idx), extractValue(leaf, idx)];
	};
	
	function BPlusTree(_opts) {
	    var opts = _opts || {};
	    this.order = _constants.ORDER;
	
	    // Used to decide whether @@iterator returns
	    // values or entries.
	    this.isSet = opts.isSet === undefined ? false : opts.isSet;
	
	    this.extractor = opts.extractor; // May be undefined on purpose.
	    this.comparator = opts.comparator || defaultComparator;
	
	    this.root = opts.root || new _nodes.Leaf({ order: this.order });
	    this.size = opts.size || 0;
	    this.height = opts.height || 0;
	    this.ownerID = opts.ownerID;
	}
	
	(0, _utils.extend)(BPlusTree.prototype, {
	    has: function has(key) {
	        return this.search(this.comparator, key) !== NOT_FOUND;
	    },
	    add: function add(value) {
	        return this.set(value, value);
	    },
	    get: function get(key) {
	        var val = this.search(this.comparator, key);
	        return val === NOT_FOUND ? undefined : val;
	    },
	    clear: function clear() {
	        return new this.constructor({
	            comparator: this.comparator,
	            extractor: this.extractor
	        });
	    },
	    set: function set(key, value) {
	        var cmp = this.comparator;
	        var extractedKey = this.extractor ? this.extractor(key) : key;
	
	        var didChange = (0, _utils.makeRef)(false);
	        var result = this.root.insert(cmp, this.ownerID, didChange, extractedKey, value);
	
	        if (!(0, _utils.isSet)(didChange)) return this;
	
	        var newRoot = void 0;
	        var rootSplit = false;
	        var canMutate = !!this.ownerID;
	
	        // Root was split
	        if (result.length === 3) {
	            rootSplit = true;
	            var splitArr = result;
	            var medianKey = splitArr[0];
	            var splitChild = splitArr[1];
	            var newChild = splitArr[2];
	
	            var newRootKeys = (0, _utils.tagOwnerID)([medianKey], this.ownerID);
	            var newRootChildren = (0, _utils.tagOwnerID)([splitChild, newChild], this.ownerID);
	
	            newRoot = new _nodes.InternalNode({
	                order: this.order,
	                keys: newRootKeys,
	                children: newRootChildren
	            });
	        } else {
	            newRoot = result;
	        }
	
	        var newHeight = rootSplit ? this.height + 1 : this.height;
	        var newSize = this.size + 1;
	
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
	            ownerID: this.ownerID
	        });
	    },
	    delete: function _delete(key) {
	        var didChange = (0, _utils.makeRef)(false);
	        var newRoot = this.root.delete(this.comparator, this.ownerID, didChange, key);
	
	        if (!(0, _utils.isSet)(didChange)) return this;
	
	        var rootMerged = false;
	        if (newRoot.size < _constants.MIN_ROOT_CHILDREN) {
	            var isLeaf = newRoot.constructor === _nodes.Leaf;
	            if (!isLeaf) {
	                // Since the minimum number of children in
	                // the root is 2, the root must have a single
	                // child.
	                newRoot = newRoot.children[0];
	                rootMerged = true;
	            }
	            // If the root is a leaf, it can be empty.
	        }
	
	        var canMutate = !!this.ownerID;
	
	        var newTree = void 0;
	        var newHeight = rootMerged ? this.height - 1 : this.height;
	        var newSize = this.size - 1;
	
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
	                ownerID: this.ownerID
	            });
	        }
	        return newTree;
	    },
	    asMutable: function asMutable() {
	        return this.ownerID ? this : new this.constructor({
	            comparator: this.comparator,
	            extractor: this.extractor,
	            root: this.root,
	            height: this.height,
	            size: this.size,
	            ownerID: (0, _utils.makeOwnerID)()
	        });
	    },
	    asImmutable: function asImmutable() {
	        return this.ownerID ? new this.constructor({
	            comparator: this.comparator,
	            extractor: this.extractor,
	            root: this.root,
	            height: this.height,
	            size: this.size
	        }) : this;
	    },
	    withMutations: function withMutations(fn) {
	        var mutable = this.asMutable();
	        fn(mutable);
	        return mutable._didAlter ? mutable.asImmutable() : this;
	    },
	    _baseBetween: function _baseBetween(extractor, _rangeSpec) {
	        if (this.size === 0) return (0, _utils.getEmptyIterator)();
	
	        var rangeSpec = (0, _utils.normalizeRangeSpec)(_rangeSpec);
	
	        var fromKey = this.extractor ? this.extractor(rangeSpec.from) : rangeSpec.from;
	
	        var toKey = this.extractor ? this.extractor(rangeSpec.to) : rangeSpec.to;
	
	        var isReverse = this.comparator(fromKey, toKey) > 0;
	
	        var fromIsRight = isReverse;
	        var toIsRight = !fromIsRight;
	
	        var fromPath = this.findPath(fromKey, fromIsRight, rangeSpec.fromInclusive);
	        var toPath = this.findPath(toKey, toIsRight, rangeSpec.toInclusive);
	
	        if (fromPath === null || toPath === null) {
	            return (0, _utils.getEmptyIterator)();
	        }
	
	        // Example: range from 0 to 1, both exclusive bounds.
	        // fromPath will point to 1, toPath to 0, which means
	        // we should return an empty iterator.
	        //
	        // In other words, the sort order of the from and to
	        // arguments must match the sort order of the paths.
	        var pathCmp = fromPath.compareTo(toPath);
	        var gotNegativeRange = pathCmp !== 0 && pathCmp > 0 === !isReverse;
	        if (gotNegativeRange) return (0, _utils.getEmptyIterator)();
	
	        return this._iteratorFromTo(extractor, fromPath, toPath, isReverse);
	    },
	
	
	    /**
	     * Returns the internal and leaf nodes
	     * on the path from root to value.
	     *
	     * @param  {Path} path
	     * @return {Array[Node]}
	     */
	    _pathNodes: function _pathNodes(path) {
	        var nodes = new Array(path.length);
	
	        var curr = this.root;
	        for (var i = 0; i < path.length; i++) {
	            nodes[i] = curr;
	            curr = curr.children[path.get(i)];
	        }
	
	        return nodes;
	    },
	    _nextPath: function _nextPath(path) {
	        var nodes = this._pathNodes(path);
	        var level = nodes.length - 1;
	
	        // Simple case: leaf index can be incremented.
	        if (path.get(level) < nodes[level].children.length - 1) {
	            return path.increment(level);
	        }
	
	        level--;
	        // Go through the node path starting from the lowest internal node and
	        // find the first node we can increment a key for.
	        while (level >= 0 && path.get(level) === nodes[level].children.length - 1) {
	            level--;
	        } // All nodes were at their maximum key
	        if (level < 0) return null;
	        return path.increment(level);
	    },
	    _prevPath: function _prevPath(path) {
	        // Leftmost path - can't decrement.
	        if (path.equals(_path2.default.EMPTY_PATH)) return null;
	
	        var nodes = this._pathNodes(path);
	
	        var level = path.length - 1;
	        while (path.get(level) === 0) {
	            level--;
	        }var newPath = path.set(level, path.get(level) - 1);
	
	        // Set all the lower keys to their
	        // maximum value.
	        var curr = nodes[level].children[newPath.get(level)];
	        level++;
	        for (; level < path.length; level++) {
	            var childLen = curr.children.length;
	            newPath = newPath.set(level, childLen - 1);
	            curr = curr.children[childLen - 1];
	        }
	        return newPath;
	    },
	    _iterateAllWithExtractFn: function _iterateAllWithExtractFn(extractFn) {
	        if (this.size === 0) return (0, _utils.getEmptyIterator)();
	
	        return this._iteratorFromTo(extractFn, this._getLeftmostPath(), this._getRightmostPath());
	    },
	    _getLeafFromPath: function _getLeafFromPath(path) {
	        var level = this.height;
	
	        var currLevel = 0;
	        var currNode = this.root;
	
	        while (currLevel !== level) {
	            currNode = currNode.children[path.get(currLevel++)];
	        }
	        return currNode;
	    },
	    _getRightmostPath: function _getRightmostPath() {
	        if (this.size === 0) return null;
	
	        var keypath = [];
	        var curr = this.root;
	        var currLevel = 0;
	        var leafLevel = this.height;
	
	        while (currLevel !== leafLevel + 1) {
	            var idx = curr.children.length - 1;
	            keypath.push(idx);
	            curr = curr.children[idx];
	            currLevel++;
	        }
	        return _path2.default.from(keypath);
	    },
	    _getLeftmostPath: function _getLeftmostPath() {
	        if (this.size === 0) {
	            return null;
	        }
	
	        return new _path2.default(_constants.SHIFT_LEN, this.height + 1);
	    },
	    _iteratorFromTo: function _iteratorFromTo(extractFn, fromPath, toPath, isReverse) {
	        var _this = this;
	
	        var getPathSuccessor = isReverse ? this._prevPath.bind(this) : this._nextPath.bind(this);
	
	        var leafLevel = this.height;
	
	        var currPath = fromPath;
	
	        // Most of the time we're just getting the next
	        // value from a leaf, so it makes sense to cache
	        // the leaf instead of looking up the successor
	        // path each time.
	        var leafCacheRef = void 0;
	        var done = false;
	        var iterator = {
	            next: function next() {
	                var pathsEq = currPath !== null && currPath.equals(toPath);
	                if (currPath !== null && (!pathsEq || !done)) {
	                    var valIdx = currPath.get(leafLevel);
	                    var leaf = leafCacheRef || _this._getLeafFromPath(currPath);
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
	
	                    var value = extractFn(leaf, valIdx);
	
	                    return {
	                        value: value
	                    };
	                }
	
	                return {
	                    done: true
	                };
	            }
	        };
	
	        iterator[_constants.ITERATOR_PROPNAME] = function () {
	            return iterator;
	        };
	
	        return iterator;
	    },
	    findPath: function findPath(key, fromRight, isInclusive) {
	        if (this.size === 0) return null;
	
	        var cmp = this.comparator;
	
	        var curr = this.root;
	        var numAccessesToReachLeaf = this.height;
	
	        // Path needs one more value (which key to look up in leaf)
	        var keypath = new Array(numAccessesToReachLeaf + 1);
	
	        var i = 0;
	        var prev = curr;
	        for (; i < numAccessesToReachLeaf; i++) {
	            var _idx = curr.childIdxForKey(cmp, key);
	            keypath[i] = _idx;
	            prev = curr;
	            curr = curr.children[_idx];
	        }
	
	        var parent = prev;
	
	        var searchFuncName = (fromRight ? 'lt' : 'gt') + (isInclusive ? 'e' : '');
	        var searchFunc = _binarysearch2.default[searchFuncName];
	
	        // curr should be a leaf now.
	        var idx = searchFunc(curr.keys, key, cmp);
	
	        if (idx === curr.keys.length) {
	            if (!fromRight) {
	                // The key we're looking for could be in the right leaf.
	                keypath[i - 1]++;
	
	                var hasRightLeaf = keypath[i - 1] < parent.children.length;
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
	
	                var hasLeftLeaf = keypath[i - 1] >= 0;
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
	
	        return _path2.default.from(keypath);
	    },
	    findLeaf: function findLeaf(cmp, key) {
	        var curr = this.root;
	        var numAccessesToReachLeaf = this.height;
	        for (var i = 0; i < numAccessesToReachLeaf; i++) {
	            var idx = curr.childIdxForKey(cmp, key);
	            curr = curr.children[idx];
	        }
	
	        return curr;
	    },
	    search: function search(cmp, key) {
	        var extractedKey = this.extractor ? this.extractor(key) : key;
	
	        var leaf = this.findLeaf(cmp, extractedKey);
	        var idx = binSearch(leaf.keys, extractedKey, cmp);
	        if (idx === -1) {
	            return NOT_FOUND;
	        }
	
	        return leaf.children[idx];
	    },
	    visit: function visit(fn) {
	        var queue = [this.root];
	        while (queue.length) {
	            var curr = queue.shift();
	            fn(curr);
	            if (curr.constructor !== _nodes.Leaf && curr.children) {
	                queue.push.apply(queue, _toConsumableArray(curr.children));
	            }
	        }
	    }
	});
	
	var makeIteratorMethod = function makeIteratorMethod(extractor) {
	    return function getRangeIterator() {
	        if (arguments.length === 0) {
	            return this._iterateAllWithExtractFn(extractor);
	        } else if (arguments.length === 1) {
	            var _spec = arguments[0];
	            return this._baseBetween(extractor, _spec);
	        }
	
	        var spec = {
	            from: arguments[0],
	            to: arguments[1]
	        };
	
	        return this._baseBetween(extractor, spec);
	    };
	};
	
	BPlusTree.prototype.values = makeIteratorMethod(extractValue);
	BPlusTree.prototype.valueRange = BPlusTree.prototype.values;
	BPlusTree.prototype.entries = makeIteratorMethod(extractEntry);
	BPlusTree.prototype.entryRange = BPlusTree.prototype.entries;
	BPlusTree.prototype.keys = makeIteratorMethod(extractKey);
	BPlusTree.prototype.keyRange = BPlusTree.prototype.keys;
	
	function fromSortedBase(arr, _opts, isPairs) {
	    var opts = _opts || {};
	
	    var order = _constants.ORDER;
	
	    // For leftmost nodes, we don't take a key
	    // to their parent. That means the parent
	    // could have one too few children, if it's
	    // already at minimum. This adjusts for that.
	    var MIN_ADJUSTMENT = 1;
	
	    var minPageLen = _constants.LEAF_MIN_CHILDREN + MIN_ADJUSTMENT;
	    var maxPageLen = _constants.LEAF_MAX_CHILDREN;
	
	    var minNodeChildren = _constants.INTERNAL_MIN_CHILDREN;
	    var maxNodeChildren = _constants.INTERNAL_MAX_CHILDREN;
	
	    var pages = (0, _utils.boundedChunk)(minPageLen, maxPageLen, arr);
	
	    var leafs = (0, _utils.fastMap)(function (page) {
	        var leafKeys = void 0;
	        if (isPairs) {
	            leafKeys = (0, _utils.fastMap)(function (item) {
	                return opts.extractor ? opts.extractor(item[0]) : item[0];
	            }, page);
	        } else {
	            leafKeys = opts.extractor ? (0, _utils.fastMap)(opts.extractor, page) : page;
	        }
	
	        var leafValues = isPairs ? (0, _utils.fastMap)(function (item) {
	            return item[1];
	        }, page) : page;
	
	        return new _nodes.Leaf({
	            order: order,
	            keys: leafKeys,
	            children: leafValues
	        });
	    }, pages);
	
	    var newHeight = 0;
	    var newRoot = null;
	    var leafsProcessed = false;
	    if (leafs.length === 1) {
	        newRoot = leafs[0];
	    } else {
	        var currLevel = leafs;
	
	        var _loop = function _loop() {
	            var chunked = (0, _utils.boundedChunk)(minNodeChildren + MIN_ADJUSTMENT, maxNodeChildren, currLevel);
	            var firstInChunk = true;
	            var nodes = (0, _utils.fastMap)(function (chunk) {
	                // eslint-disable-line
	                // For leafs, we use the first key as the key
	                // for the whole chunk.
	                // For internal nodes, we move the first
	                // key up a level.
	                var operation = leafsProcessed ? function (child) {
	                    var _head = child.keys[0];
	                    child.keys = (0, _utils.tail)(null, child.keys); // eslint-disable-line
	                    return _head;
	                } : function (child) {
	                    return child.keys[0];
	                };
	
	                // For the left-most nodes, we don't
	                // take a key from its children.
	                var operateOn = firstInChunk ? (0, _utils.tail)(null, chunk) : chunk;
	
	                var newKeys = (0, _utils.fastMap)(operation, operateOn);
	
	                firstInChunk = false;
	                return new _nodes.InternalNode({
	                    order: order,
	                    keys: newKeys,
	                    children: chunk
	                });
	            }, chunked);
	
	            if (nodes.length === 0) return 'break';
	            currLevel = nodes;
	            leafsProcessed = true;
	            newHeight++;
	        };
	
	        while (currLevel.length > 1) {
	            var _ret = _loop();
	
	            if (_ret === 'break') break;
	        }
	
	        newRoot = currLevel[0];
	    }
	
	    var _constructor = this;
	    return new _constructor((0, _utils.extend)({}, opts, {
	        root: newRoot,
	        size: arr.length,
	        height: newHeight
	    }));
	}
	
	function fromSortedPairs(arr, opts) {
	    return fromSortedBase.call(this, arr, opts, true);
	}
	
	function fromSortedValues(arr, opts) {
	    return fromSortedBase.call(this, arr, opts, false);
	}
	
	BPlusTree.from = fromSortedPairs;
	
	BPlusTree.prototype[_constants.ITERATOR_PROPNAME] = function iterator() {
	    return this.isSet ? this.values() : this.entries();
	};
	
	var BTMap = exports.BTMap = BPlusTree;
	
	function BTSet(_opts) {
	    var opts = _opts || {};
	    opts.isSet = true;
	    BPlusTree.call(this, opts);
	}
	
	BTSet.from = fromSortedValues;
	
	BTSet.prototype = BPlusTree.prototype;
	
	exports.default = BTMap;

/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.baseGte = baseGte;
	exports.eq = eq;
	function baseLte(inclusive, array, value, cmp) {
	    var len = array.length;
	    if (len === 0 || !(inclusive ? cmp(array[0], value) <= 0 : cmp(array[0], value) < 0)) {
	        return -1;
	    }
	
	    var l = 0;
	    var r = len;
	    while (r - l > 1) {
	        // In our case, r + l <= 128 so we don't need
	        // to worry about overflow here
	        var mid = r + l >>> 1;
	        var item = array[mid];
	        if (inclusive ? cmp(item, value) <= 0 : cmp(item, value) < 0) {
	            l = mid;
	        } else {
	            r = mid;
	        }
	    }
	
	    return l;
	}
	
	var lte = exports.lte = baseLte.bind(null, true);
	var lt = exports.lt = baseLte.bind(null, false);
	
	function baseGte(inclusive, array, value, cmp) {
	    var len = array.length;
	    if (len === 0 || !(inclusive ? cmp(array[len - 1], value) >= 0 : cmp(array[len - 1], value) > 0)) return len;
	    var l = -1;
	    var r = len - 1;
	    while (r - l > 1) {
	        var mid = r + l >>> 1;
	        var item = array[mid];
	        if (inclusive ? cmp(item, value) >= 0 : cmp(item, value) > 0) {
	            r = mid;
	        } else {
	            l = mid;
	        }
	    }
	
	    return r;
	}
	
	var gte = exports.gte = baseGte.bind(null, true);
	var gt = exports.gt = baseGte.bind(null, false);
	
	function eq(array, value, cmp) {
	    var idx = lte(array, value, cmp);
	    if (idx !== -1 && cmp(array[idx], value) === 0) {
	        return idx;
	    }
	    return -1;
	}
	
	exports.default = {
	    lt: lt,
	    gt: gt,
	    lte: lte,
	    gte: gte,
	    eq: eq
	};

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.InternalNode = exports.Leaf = exports.Node = exports.DELETION_STRATEGIES = undefined;
	
	var _binarysearch = __webpack_require__(1);
	
	var _binarysearch2 = _interopRequireDefault(_binarysearch);
	
	var _constants = __webpack_require__(3);
	
	var _utils = __webpack_require__(4);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var binSearch = _binarysearch2.default.eq;
	
	var internalInsertKeyAt = function internalInsertKeyAt(cmp, key, keys) {
	    return _binarysearch2.default.gte(keys, key, cmp);
	};
	
	function Node(_opts) {
	    var opts = _opts || {};
	    this.keys = opts.keys || [];
	    this.children = opts.children || [];
	    this.order = _constants.ORDER;
	    this.ownerID = opts.ownerID;
	}
	
	Object.defineProperty(Node.prototype, 'size', {
	    enumerable: true,
	    get: function get() {
	        return this.children.length;
	    }
	});
	
	(0, _utils.extend)(Node.prototype, {
	    satisfiesMinChildren: function satisfiesMinChildren() {
	        return this.children.length >= this.minChildren;
	    },
	    satisfiesMaxChildren: function satisfiesMaxChildren() {
	        return this.children.length <= this.maxChildren;
	    },
	    tail: function tail(ownerID) {
	        return new this.constructor({
	            order: this.order,
	            keys: (0, _utils.tail)(ownerID, this.keys),
	            children: (0, _utils.tail)(ownerID, this.children),
	            ownerID: ownerID
	        });
	    },
	    init: function init(ownerID) {
	        return new this.constructor({
	            order: this.order,
	            keys: (0, _utils.init)(ownerID, this.keys),
	            children: (0, _utils.init)(ownerID, this.children),
	            ownerID: ownerID
	        });
	    },
	    shouldSplit: function shouldSplit() {
	        return !this.satisfiesMaxChildren();
	    }
	});
	
	function Leaf(opts) {
	    Node.call(this, opts);
	}
	
	Leaf.prototype = Object.create(Node.prototype);
	Leaf.prototype.constructor = Leaf;
	
	(0, _utils.extend)(Leaf.prototype, {
	    maxChildren: _constants.LEAF_MAX_CHILDREN,
	
	    minChildren: _constants.LEAF_MIN_CHILDREN,
	
	    delete: function _delete(cmp, ownerID, didChange, key) {
	        var idx = binSearch(this.keys, key, cmp);
	        // Key was not found. No modifications needed.
	        if (idx === -1) {
	            return this;
	        }
	
	        (0, _utils.setRef)(didChange);
	
	        var newLeaf = void 0;
	        var newKeys = (0, _utils.withoutIdx)(ownerID, idx, this.keys);
	        var newChildren = (0, _utils.withoutIdx)(ownerID, idx, this.children);
	
	        if ((0, _utils.canMutate)(this, ownerID)) {
	            newLeaf = this;
	            newLeaf.keys = newKeys;
	            newLeaf.children = newChildren;
	        } else {
	            newLeaf = new Leaf({
	                order: this.order,
	                keys: (0, _utils.withoutIdx)(ownerID, idx, this.keys),
	                children: (0, _utils.withoutIdx)(ownerID, idx, this.children),
	                ownerID: ownerID
	            });
	        }
	
	        return newLeaf;
	    },
	
	
	    /**
	     * Returns a new leaf with entries merged
	     * from `otherLeaf`. The keys in `otherLeaf`
	     * must be higher than in the current leaf,
	     * i.e. `otherLeaf` must reside to the right of
	     * this leaf in the tree.
	     * @param  {Leaf} otherLeaf - other leaf to merge
	     * @return {Leaf} a new Leaf with entries merged.
	     */
	    merge: function merge(otherLeaf) {
	        return new Leaf({
	            order: this.order,
	            keys: this.keys.concat(otherLeaf.keys),
	            children: this.children.concat(otherLeaf.children)
	        });
	    },
	    idxForKey: function idxForKey(cmp, key) {
	        return _binarysearch2.default.gte(this.keys, key, cmp);
	    },
	    insert: function insert(cmp, ownerID, didChange, key, value) {
	        var idx = this.idxForKey(cmp, key);
	        var alreadyHasKey = this.keys[idx] === key;
	
	        var newKeys = void 0;
	        var newChildren = void 0;
	
	        if (!alreadyHasKey) {
	            newKeys = (0, _utils.insert)(ownerID, idx, key, this.keys);
	            newChildren = (0, _utils.insert)(ownerID, idx, value, this.children);
	        } else {
	            var existingValue = this.children[idx];
	            if (existingValue === value) {
	                return this;
	            }
	
	            newKeys = (0, _utils.set)(ownerID, idx, key, this.keys);
	            newChildren = (0, _utils.set)(ownerID, idx, value, this.children);
	        }
	
	        (0, _utils.setRef)(didChange);
	
	        var newLeaf = void 0;
	        if ((0, _utils.canMutate)(this, ownerID)) {
	            newLeaf = this;
	            this.keys = newKeys;
	            this.children = newChildren;
	        } else {
	            newLeaf = new Leaf({
	                order: this.order,
	                keys: newKeys,
	                children: newChildren,
	                ownerID: ownerID
	            });
	        }
	
	        return newLeaf.shouldSplit() ? newLeaf.split(ownerID) : newLeaf;
	    },
	    split: function split(ownerID) {
	        var cutoff = (0, _utils.median)(this.keys.length);
	        var smallestKeyInOther = this.keys[cutoff];
	
	        var keypair = (0, _utils.splitAt)(ownerID, cutoff, this.keys);
	        var thisKeys = keypair[0];
	        var otherKeys = keypair[1];
	
	        var childrenPair = (0, _utils.splitAt)(ownerID, cutoff, this.children);
	        var thisChildren = childrenPair[0];
	        var otherChildren = childrenPair[1];
	
	        var other = new Leaf({
	            order: this.order,
	            keys: otherKeys,
	            children: otherChildren,
	            ownerID: ownerID
	        });
	
	        var thisSplit = void 0;
	        if ((0, _utils.canMutate)(this, ownerID)) {
	            thisSplit = this;
	            thisSplit.keys = thisKeys;
	            thisSplit.children = thisChildren;
	        } else {
	            thisSplit = new Leaf({
	                order: this.order,
	                keys: thisKeys,
	                children: thisChildren,
	                ownerID: ownerID
	            });
	        }
	
	        return [smallestKeyInOther, thisSplit, other];
	    },
	    smallestKey: function smallestKey() {
	        return this.keys[0];
	    },
	    stealFirstKeyFrom: function stealFirstKeyFrom(ownerID, rightSibling) {
	        var stolenKey = rightSibling.keys[0];
	        var stolenValue = rightSibling.children[0];
	
	        // Note: mutative. If we're stealing a key,
	        // it means this node was created during
	        // the edit and can be mutated.
	        this.keys = this.keys.concat(stolenKey);
	        this.children = this.children.concat(stolenValue);
	
	        var siblingWithoutFirstKey = rightSibling.tail(ownerID);
	        return [this, siblingWithoutFirstKey];
	    },
	    giveLastKeyTo: function giveLastKeyTo(ownerID, rightSibling) {
	        var keyToGive = this.keys[this.keys.length - 1];
	        var valueToGive = this.children[this.children.length - 1];
	
	        // Note: mutative. If we're giving a key,
	        // it means the sibling node was created during
	        // the edit and can be mutated.
	        rightSibling.keys = (0, _utils.unshift)(ownerID, keyToGive, rightSibling.keys);
	        rightSibling.children = (0, _utils.unshift)(ownerID, valueToGive, rightSibling.children);
	
	        var thisWithoutLastKey = this.init(ownerID);
	        return [thisWithoutLastKey, rightSibling];
	    }
	});
	
	function InternalNode(opts) {
	    Node.call(this, opts);
	}
	
	var REPLACE = 'REPLACE';
	var STEAL_KEY_FROM_LEFT = 'STEAL_KEY_FROM_LEFT';
	var STEAL_KEY_FROM_RIGHT = 'STEAL_KEY_FROM_RIGHT';
	var MERGE = 'MERGE';
	
	var DELETION_STRATEGIES = exports.DELETION_STRATEGIES = {
	    STEAL_KEY_FROM_LEFT: STEAL_KEY_FROM_LEFT,
	    STEAL_KEY_FROM_RIGHT: STEAL_KEY_FROM_RIGHT,
	    MERGE: MERGE
	};
	
	InternalNode.prototype = Object.create(Node.prototype);
	InternalNode.prototype.constructor = InternalNode;
	
	(0, _utils.extend)(InternalNode.prototype, {
	    maxChildren: _constants.INTERNAL_MAX_CHILDREN,
	
	    minChildren: _constants.INTERNAL_MIN_CHILDREN,
	
	    merge: function merge(otherNode) {
	        // We have ak + bk keys, and ac + bc children.
	        // In a node, ac - ak === 1 (one less key than children).
	        // Because (ac + bc) - (ak + bk) === 2, we need to add a key.
	        // The key is the smallest key on the right node subtree.
	        var toConcat = (0, _utils.unshift)(null, otherNode.smallestKey(), otherNode.keys);
	        var newNode = new InternalNode({
	            order: this.order,
	            keys: this.keys.concat(toConcat),
	            children: this.children.concat(otherNode.children)
	        });
	        return newNode;
	    },
	    chooseComplexDeletionStrategy: function chooseComplexDeletionStrategy(childIdx, newChild) {
	        // When we need to merge, steal or give keys to
	        // siblings -- this method returns the operation parameters,
	        // which are: the left node, the right node, the index of
	        // the left node in this nodes `children` array, and the
	        // strategy to use (merge, steal from right, steal from left).
	
	        if (newChild.satisfiesMinChildren()) {
	            return {
	                strategy: REPLACE
	            };
	        }
	
	        var hasRightSibling = childIdx + 1 < this.children.length;
	        var hasLeftSibling = childIdx - 1 >= 0;
	
	        var isLeaf = newChild.constructor === Leaf;
	
	        var nullSibling = { size: 0 };
	
	        var rightSibling = hasRightSibling ? this.children[childIdx + 1] : nullSibling;
	
	        var leftSibling = hasLeftSibling ? this.children[childIdx - 1] : nullSibling;
	
	        var minChildren = isLeaf ? _constants.LEAF_MIN_CHILDREN : _constants.INTERNAL_MIN_CHILDREN;
	
	        var strategy = void 0;
	        if (rightSibling.size >= leftSibling.size) {
	            if (rightSibling.size <= minChildren) {
	                strategy = MERGE;
	            } else {
	                strategy = STEAL_KEY_FROM_RIGHT;
	            }
	
	            return {
	                leftNode: newChild,
	                rightNode: rightSibling,
	                leftNodeIdx: childIdx,
	                strategy: strategy
	            };
	        } else {
	            if (leftSibling.size <= minChildren) {
	                strategy = MERGE;
	            } else {
	                strategy = STEAL_KEY_FROM_LEFT;
	            }
	            return {
	                leftNode: leftSibling,
	                rightNode: newChild,
	                leftNodeIdx: childIdx - 1,
	                strategy: strategy
	            };
	        }
	    },
	    delete: function _delete(cmp, ownerID, didChange, key) {
	        var childIdx = this.childIdxForKey(cmp, key);
	        var origChild = this.children[childIdx];
	        var child = origChild.delete(cmp, ownerID, didChange, key);
	
	        if (!(0, _utils.isSet)(didChange)) return this;
	
	        var strategyInfo = this.chooseComplexDeletionStrategy(childIdx, child);
	        var strategy = strategyInfo.strategy;
	
	        if (strategy === REPLACE) {
	            return this.withReplacedChildren(ownerID, childIdx, [child]);
	        }
	
	        var leftNode = strategyInfo.leftNode;
	        var rightNode = strategyInfo.rightNode;
	        var leftNodeIdx = strategyInfo.leftNodeIdx;
	
	
	        if (strategy === MERGE) {
	            return this.withMergedChildren(ownerID, leftNodeIdx, leftNode, rightNode);
	        }
	
	        var newLeftNode = void 0;
	        var newRightNode = void 0;
	        if (strategy === STEAL_KEY_FROM_RIGHT) {
	            var newNodes = leftNode.stealFirstKeyFrom(ownerID, rightNode);
	            newLeftNode = newNodes[0];
	            newRightNode = newNodes[1];
	        } else if (strategy === STEAL_KEY_FROM_LEFT) {
	            var _newNodes = leftNode.giveLastKeyTo(ownerID, rightNode);
	            newLeftNode = _newNodes[0];
	            newRightNode = _newNodes[1];
	        }
	
	        var withReplacedChildren = this.withReplacedChildren(ownerID, leftNodeIdx, [newLeftNode, newRightNode]);
	
	        // Key must be updated because of the child key theft.
	        var keyIdxToReplace = leftNodeIdx;
	        var newKey = newRightNode.smallestKey();
	
	        withReplacedChildren.keys = (0, _utils.set)(ownerID, keyIdxToReplace, newKey, withReplacedChildren.keys);
	        return withReplacedChildren;
	    },
	    withMergedChildren: function withMergedChildren(ownerID, leftChildIdx, leftNode, rightNode) {
	        var mergedChild = leftNode.merge(rightNode);
	
	        var keyIdxToPop = leftChildIdx;
	
	        var newKeys = (0, _utils.withoutIdx)(ownerID, keyIdxToPop, this.keys);
	
	        var areLeftmostNodes = leftChildIdx === 0;
	
	        if (!areLeftmostNodes) {
	            newKeys[leftChildIdx - 1] = mergedChild.smallestKey();
	        }
	
	        var newChildren = (0, _utils.arrayClone)(this.children);
	        newChildren.splice(leftChildIdx, 1);
	        newChildren[leftChildIdx] = mergedChild;
	
	        var withReplacedChild = new InternalNode({
	            order: this.order,
	            keys: newKeys,
	            children: newChildren,
	            ownerID: ownerID
	        });
	        return withReplacedChild;
	    },
	    childIdxForKey: function childIdxForKey(cmp, key) {
	        return _binarysearch2.default.lte(this.keys, key, cmp) + 1;
	    },
	    stealFirstKeyFrom: function stealFirstKeyFrom(ownerID, rightSibling) {
	        // Note that we mutate `this`.
	        // Whenever we're stealing a first key,
	        // it means this node was created during
	        // the current update and can be mutated.
	        var stolenValue = rightSibling.children[0];
	
	        this.keys = this.keys.concat(rightSibling.smallestKey());
	        this.children = this.children.concat(stolenValue);
	
	        return [this, rightSibling.tail(ownerID)];
	    },
	    giveLastKeyTo: function giveLastKeyTo(ownerID, rightSibling) {
	        // Steal last key-value pair from left node
	        var stolenValue = (0, _utils.last)(this.children);
	        rightSibling.keys = (0, _utils.unshift)(ownerID, rightSibling.smallestKey(), rightSibling.keys);
	        rightSibling.children = (0, _utils.unshift)(ownerID, stolenValue, rightSibling.children);
	
	        return [this.init(ownerID), rightSibling];
	    },
	    withReplacedChildren: function withReplacedChildren(ownerID, idx, newChildren) {
	        var replaced = (0, _utils.canMutate)(this.children, ownerID) ? this.children : (0, _utils.arrayClone)(this.children);
	
	        for (var i = 0; i < newChildren.length; i++) {
	            replaced[idx + i] = newChildren[i];
	        }
	
	        if ((0, _utils.canMutate)(this, ownerID)) {
	            this.children = replaced;
	            return this;
	        }
	
	        return new InternalNode({
	            order: this.order,
	            keys: this.keys,
	            children: replaced,
	            ownerID: ownerID
	        });
	    },
	    smallestKey: function smallestKey() {
	        var curr = this;
	        while (curr.constructor !== Leaf) {
	            curr = curr.children[0];
	        }
	        return curr.keys[0];
	    },
	    split: function split(ownerID) {
	        var medianIdx = (0, _utils.median)(this.keys.length) - 1;
	
	        var splitArr = (0, _utils.takeIdxAndSplit)(ownerID, medianIdx, this.keys);
	        var thisKeys = splitArr[0];
	        var medianKey = splitArr[1];
	        var otherKeys = splitArr[2];
	
	        var childrenPair = (0, _utils.splitAt)(ownerID, medianIdx + 1, this.children);
	        var thisChildren = childrenPair[0];
	        var otherChildren = childrenPair[1];
	
	        var thisNode = void 0;
	        if ((0, _utils.canMutate)(this, ownerID)) {
	            thisNode = this;
	            thisNode.keys = thisKeys;
	            thisNode.children = thisChildren;
	        } else {
	            thisNode = new InternalNode({
	                order: this.order,
	                keys: thisKeys,
	                children: thisChildren,
	                ownerID: ownerID
	            });
	        }
	
	        var otherNode = new InternalNode({
	            order: this.order,
	            keys: otherKeys,
	            children: otherChildren,
	            ownerID: ownerID
	        });
	
	        return [medianKey, thisNode, otherNode];
	    },
	    withSplitChild: function withSplitChild(cmp, ownerID, newKey, splitChild, newChild) {
	        var insertNewKeyAt = internalInsertKeyAt(cmp, newKey, this.keys);
	        var newKeys = (0, _utils.insert)(ownerID, insertNewKeyAt, newKey, this.keys);
	
	        var newChildren = (0, _utils.insert)(ownerID, insertNewKeyAt + 1, newChild, this.children);
	        // Replace the original child with the split one.
	        newChildren[insertNewKeyAt] = splitChild;
	
	        if ((0, _utils.canMutate)(this, ownerID)) {
	            this.keys = newKeys;
	            this.children = newChildren;
	            return this;
	        }
	
	        return new InternalNode({
	            order: this.order,
	            keys: newKeys,
	            children: newChildren,
	            ownerID: ownerID
	        });
	    },
	    insert: function insert(cmp, ownerID, didChange, key, value) {
	        var childIdx = this.childIdxForKey(cmp, key);
	        var child = this.children[childIdx];
	
	        var newChild = child.insert(cmp, ownerID, didChange, key, value);
	
	        if (!(0, _utils.isSet)(didChange)) return this;
	
	        // Got new child.
	
	        // Child was split on insertion.
	        if (newChild.length === 3) {
	            var splitArr = newChild;
	            var medianKey = splitArr[0];
	            var splitChild = splitArr[1];
	            var _newChild = splitArr[2];
	
	            var withSplitChild = this.withSplitChild(cmp, ownerID, medianKey, splitChild, _newChild);
	            return withSplitChild.shouldSplit() ? withSplitChild.split(ownerID) : withSplitChild;
	        }
	
	        return this.withReplacedChildren(ownerID, childIdx, [newChild]);
	    }
	});
	
	exports.Node = Node;
	exports.Leaf = Leaf;
	exports.InternalNode = InternalNode;

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var MIN_ROOT_CHILDREN = exports.MIN_ROOT_CHILDREN = 2;
	
	// These numbers are optimized for the Path implementation.
	// With these values we can store paths in the binary representation
	// of an integer - the lowest 30 bits divide to 5 parts of 6 bits each.
	// During range searches and iteration, we check if we've reached the
	// end path at each element. When the path is represented as an integer,
	// we can do a fast integer comparison.
	//
	// 6 bits gives us a range of 2^6 = 64 values for each part.
	// The maximum tree size with these limitations should be more than enough,
	// 64^5 - 1 = 1,073,741,823, that's about 1 billion elements.
	var ORDER = exports.ORDER = 64;
	var SHIFT_LEN = exports.SHIFT_LEN = 6;
	
	var LEAF_MIN_CHILDREN = exports.LEAF_MIN_CHILDREN = Math.ceil(ORDER / 2) - 1;
	var LEAF_MAX_CHILDREN = exports.LEAF_MAX_CHILDREN = ORDER - 1;
	var INTERNAL_MIN_CHILDREN = exports.INTERNAL_MIN_CHILDREN = Math.ceil(ORDER / 2);
	var INTERNAL_MAX_CHILDREN = exports.INTERNAL_MAX_CHILDREN = ORDER;
	
	var ITERATOR_PROPNAME = exports.ITERATOR_PROPNAME = typeof Symbol === 'function' ? Symbol.iterator : '@@iterator';

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.boundedChunk = exports.takeIdxAndSplit = exports.median = undefined;
	exports.makeOwnerID = makeOwnerID;
	exports.tagOwnerID = tagOwnerID;
	exports.canMutate = canMutate;
	exports.slice = slice;
	exports.arrayClone = arrayClone;
	exports.withoutIdx = withoutIdx;
	exports.insert = insert;
	exports.set = set;
	exports.fastMap = fastMap;
	exports.splitAt = splitAt;
	exports.unshift = unshift;
	exports.last = last;
	exports.init = init;
	exports.tail = tail;
	exports.getEmptyIterator = getEmptyIterator;
	exports.extend = extend;
	exports.makeRef = makeRef;
	exports.setRef = setRef;
	exports.isSet = isSet;
	exports.normalizeRangeSpec = normalizeRangeSpec;
	
	var _constants = __webpack_require__(3);
	
	var median = exports.median = function median(len) {
	    return Math.ceil(len / 2);
	};
	
	function makeOwnerID() {
	    return {};
	}
	
	function tagOwnerID(obj, ownerID) {
	    obj.ownerID = ownerID;
	    return obj;
	}
	
	function canMutate(obj, ownerID) {
	    return ownerID && ownerID === obj.ownerID;
	}
	
	function allocateArray(ownerID, len) {
	    return tagOwnerID(len ? new Array(len) : [], ownerID);
	}
	
	function slice(ownerID, start, end, arr) {
	    var newLen = end - start;
	    if (canMutate(arr, ownerID)) {
	        var removeNFromStart = start;
	        var removeNFromEnd = arr.length - end;
	        while (removeNFromStart--) {
	            arr.shift();
	        }
	        while (removeNFromEnd--) {
	            arr.pop();
	        }
	
	        return arr;
	    }
	
	    var newArr = allocateArray(ownerID, newLen);
	    for (var i = start; i < end; i++) {
	        newArr[i - start] = arr[i];
	    }
	    return newArr;
	}
	
	function arrayClone(arr) {
	    var len = arr.length;
	    var copy = new Array(len);
	
	    for (var i = 0; i < len; i++) {
	        copy[i] = arr[i];
	    }
	    return copy;
	}
	
	function withoutIdx(ownerID, idx, arr) {
	    var copied = canMutate(arr, ownerID) ? arr : tagOwnerID(arrayClone(arr), ownerID);
	
	    copied.splice(idx, 1);
	    return copied;
	}
	
	function insert(ownerID, idx, val, arr) {
	    if (canMutate(arr, ownerID)) {
	        arr.splice(idx, 0, val);
	        return arr;
	    }
	
	    var newArrLen = arr.length + 1;
	    var newArr = new Array(newArrLen);
	
	    var i = 0;
	    for (; i < idx; i++) {
	        newArr[i] = arr[i];
	    }
	
	    newArr[i++] = val;
	
	    for (; i < newArrLen; i++) {
	        newArr[i] = arr[i - 1];
	    }
	
	    return newArr;
	}
	
	function set(ownerID, idx, val, arr) {
	    var copied = canMutate(arr, ownerID) ? arr : tagOwnerID(arrayClone(arr), ownerID);
	
	    copied[idx] = val;
	    return copied;
	}
	
	function fastMap(fn, arr) {
	    var copied = arrayClone(arr);
	    var len = arr.length;
	    for (var i = 0; i < len; i++) {
	        copied[i] = fn(arr[i], i);
	    }
	    return copied;
	}
	
	function splitAt(ownerID, idx, arr) {
	    var arrLen = arr.length;
	    var firstArrLen = idx;
	    var secondArrLen = arrLen - idx;
	    var secondArr = allocateArray(ownerID, secondArrLen);
	
	    var firstArr = allocateArray(ownerID, firstArrLen);
	
	    for (var i = 0; i < idx; i++) {
	        firstArr[i] = arr[i];
	    }
	
	    for (var _i = idx; _i < arrLen; _i++) {
	        secondArr[_i - idx] = arr[_i];
	    }
	
	    return [firstArr, secondArr];
	}
	
	function unshift(ownerID, value, arr) {
	    return insert(ownerID, 0, value, arr);
	}
	
	var takeIdxAndSplit = exports.takeIdxAndSplit = function takeIdxAndSplit(ownerID, idx, arr) {
	    var cutoff = idx;
	    var a1len = cutoff;
	    var arr1 = slice(ownerID, 0, a1len, arr);
	    var arr2 = slice(ownerID, cutoff + 1, arr.length, arr);
	    return [arr1, arr[cutoff], arr2];
	};
	
	function last(arr) {
	    return arr[arr.length - 1];
	}
	
	function init(ownerID, arr) {
	    if (canMutate(arr, ownerID)) {
	        if (arr.length === 0) return arr;
	        arr.pop();
	        return arr;
	    }
	
	    if (arr.length <= 1) return allocateArray(ownerID);
	    return slice(ownerID, 0, arr.length - 1, arr);
	}
	
	function tail(ownerID, arr) {
	    if (canMutate(arr, ownerID)) {
	        arr.shift();
	        return arr;
	    }
	
	    if (arr.length <= 1) return tagOwnerID([], ownerID);
	    return slice(ownerID, 1, arr.length, arr);
	}
	
	function getEmptyIterator() {
	    var iterator = {
	        next: function next() {
	            return { done: true };
	        }
	    };
	
	    iterator[_constants.ITERATOR_PROPNAME] = function () {
	        return iterator;
	    };
	
	    return iterator;
	}
	
	var boundedChunk = exports.boundedChunk = function boundedChunk(min, max, arr) {
	    var arrLen = arr.length;
	    if (!arr.length) return [];
	    if (arr.length <= max) {
	        return [arr];
	    }
	
	    var avg = Math.ceil((min + max) / 2);
	    var parts = arrLen / avg;
	    var chunkCount = Math.ceil(parts);
	    var splitsize = 1 / chunkCount * arrLen;
	    var chunks = new Array(chunkCount);
	    for (var i = 0; i < chunkCount; i++) {
	        chunks[i] = arr.slice(Math.ceil(i * splitsize), Math.ceil((i + 1) * splitsize));
	    }
	    return chunks;
	};
	
	function extend(target) {
	    var argsLen = arguments.length;
	    var source = void 0;
	    var keys = void 0;
	    var key = void 0;
	    var i = void 0;
	    var j = void 0;
	
	    for (j = 1; j < argsLen; j++) {
	        source = arguments[j];
	        keys = Object.keys(source);
	        for (i = 0; i < keys.length; i++) {
	            key = keys[i];
	            target[key] = source[key];
	        }
	    }
	    return target;
	}
	
	function makeRef(value) {
	    return { value: value };
	}
	
	function setRef(ref) {
	    ref.value = true;
	}
	
	function isSet(ref) {
	    return !!ref.value;
	}
	
	function normalizeRangeSpec(spec) {
	    return {
	        from: spec.from,
	        to: spec.to,
	        fromInclusive: spec.hasOwnProperty('fromInclusive') ? spec.fromInclusive : true,
	        toInclusive: spec.hasOwnProperty('toInclusive') ? spec.toInclusive : true
	    };
	}

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.Path = exports.safePathSet = exports.clearBitRange = exports.pathSet = exports.pathGet = exports.bitSlice = exports.LEVELS = undefined;
	
	var _constants = __webpack_require__(3);
	
	var _utils = __webpack_require__(4);
	
	var MIN_PATH = 0;
	var NUMBER_OF_UNSIGNED_BITS = 31;
	
	var LEVELS = exports.LEVELS = Math.floor(NUMBER_OF_UNSIGNED_BITS / _constants.SHIFT_LEN);
	
	/**
	 * Slices a range of bits from the binary
	 * representation of a number.
	 *
	 * Example:
	 *     num: decimal 376 = binary 101111000
	 *     fromBit: 3
	 *     toBit: 9
	 *     Returns decimal 47 = binary 101111
	 *
	 * @param  {Number} fromBit - bit to start slicing from, inclusive
	 * @param  {Number} toBit - bit to stop slicing at, exclusive
	 * @param  {Number} num - number to slice
	 * @return {Number} sliced number
	 */
	var bitSlice = exports.bitSlice = function bitSlice(fromBit, toBit, num) {
	    // toBit exclusive. Mask is from bits 0..toBit - 1.
	    var mask = Math.pow(2, toBit) - 1;
	
	    return (num & mask) >>> fromBit;
	};
	
	/**
	 * Gets the path value for a given level.
	 *
	 * Example:
	 *     shiftLen: 6
	 *     level: 1
	 *     path:  decimal 16518336 = binary 111111 000000 110011 000000
	 *     Returns: decimal 51 = 110011
	 *
	 * @param  {Number} shiftLen - the binary representation length of a single level
	 * @param  {Number} level - the level to get a value from, starting at 0
	 * @param  {Number} path - input path
	 * @return {Number} value for `path` at level `level`
	 */
	var pathGet = exports.pathGet = function pathGet(shiftLen, level, path) {
	    return bitSlice(shiftLen * level, shiftLen * (level + 1), path);
	};
	
	/**
	 * Returns a new updated path where the value for a given level is
	 * set to `newValue`. The current value of path at the given level must be 0.
	 *
	 * @param  {Number} shiftLen - the binary representation length of a single level
	 * @param  {Number} level - the level to set the value to, starting at 0
	 * @param  {Number} path
	 * @param  {Number} newValue
	 * @return {Number} an updated path
	 */
	var pathSet = exports.pathSet = function pathSet(shiftLen, level, path, newValue) {
	    return path | newValue << shiftLen * level;
	};
	
	var clearBitRange = exports.clearBitRange = function clearBitRange(fromBit, toBit, num) {
	    var rangeLen = toBit - fromBit;
	    var mask = Math.pow(2, rangeLen) - 1;
	    return num & ~(mask << fromBit);
	};
	
	// Safe version of `pathSet` where the current value is cleared before
	// assigning a new value.
	var safePathSet = exports.safePathSet = function safePathSet(shiftLen, level, path, newValue) {
	    var cleared = clearBitRange(shiftLen * level, shiftLen * (level + 1), path);
	    return pathSet(shiftLen, level, cleared, newValue);
	};
	
	function Path(shiftLen, levels, path) {
	    this.shiftLen = shiftLen || _constants.SHIFT_LEN;
	    this.length = levels || LEVELS;
	    this._path = path || 0;
	}
	
	Path.EMPTY_PATH = new Path(_constants.SHIFT_LEN, LEVELS, MIN_PATH);
	Path.from = function from(arr) {
	    var levels = arr.length;
	
	    var path = 0;
	    for (var i = 0; i < levels; i++) {
	        path = pathSet(_constants.SHIFT_LEN, i, path, arr[i]);
	    }
	
	    return new Path(_constants.SHIFT_LEN, levels, path);
	};
	
	(0, _utils.extend)(Path.prototype, {
	    get: function get(level) {
	        return pathGet(this.shiftLen, level, this._path);
	    },
	    equals: function equals(otherPath) {
	        return this._path === otherPath._path;
	    },
	    clearAfter: function clearAfter(level) {
	        var currLevel = level + 1;
	        var newPath = this;
	        while (currLevel < this.length) {
	            newPath = newPath.set(currLevel, 0);
	            currLevel++;
	        }
	        return newPath;
	    },
	    toArray: function toArray() {
	        var arr = new Array(this.length);
	        for (var i = 0; i < this.length; i++) {
	            arr[i] = this.get(i);
	        }
	        return arr;
	    },
	    compareTo: function compareTo(otherPath) {
	        var thisArr = this.toArray();
	        var otherArr = otherPath.toArray();
	
	        for (var i = 0; i < this.length; i++) {
	            var a = thisArr[i];
	            var b = otherArr[i];
	            if (a !== b) {
	                return a < b ? -1 : 1;
	            }
	        }
	        return 0;
	    },
	    increment: function increment(level) {
	        var newPath = this.set(level, this.get(level) + 1);
	        return newPath.clearAfter(level);
	    },
	    decrement: function decrement(level) {
	        return this.set(level, this.get(level) - 1);
	    },
	    set: function set(level, value) {
	        var newPath = safePathSet(this.shiftLen, level, this._path, value);
	        return new Path(this.shiftLen, this.length, newPath);
	    }
	});
	
	exports.Path = Path;
	exports.default = Path;

/***/ }
/******/ ])
});
;
//# sourceMappingURL=ibtree.js.map
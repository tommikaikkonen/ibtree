import binarySearch from './binarysearch';
import {
    ORDER,
    LEAF_MIN_CHILDREN,
    LEAF_MAX_CHILDREN,
    INTERNAL_MIN_CHILDREN,
    INTERNAL_MAX_CHILDREN,
} from './constants';
import {
    takeIdxAndSplit,
    insert,
    fastSet,
    fastArrayClone,
    unshift,
    splitAt,
    withoutIdx,
    last,
    init,
    tail,
    median,
    extend,
    tagOwnerID,
} from './utils';

const binSearch = binarySearch.eq;

const internalInsertKeyAt = (cmp, key, keys) => binarySearch.gte(keys, key, cmp);

function Node(_opts) {
    const opts = _opts || {};
    this.keys = opts.keys || [];
    this.children = opts.children || [];
    this.order = ORDER;
    this.ownerID = opts.ownerID;
}

Object.defineProperty(Node.prototype, 'size', {
    enumerable: true,
    get() {
        return this.children.length;
    },
});

extend(Node.prototype, {
    satisfiesMinChildren() {
        return this.children.length >= this.minChildren;
    },

    satisfiesMaxChildren() {
        return this.children.length <= this.maxChildren;
    },

    tail() {
        return new this.constructor({
            order: this.order,
            keys: tail(this.keys),
            children: tail(this.children),
        });
    },

    init() {
        return new this.constructor({
            order: this.order,
            keys: init(this.keys),
            children: init(this.children),
        });
    },

    shouldSplit() {
        return !this.satisfiesMaxChildren();
    },
});

function Leaf(opts) {
    Node.call(this, opts);
}

Leaf.prototype = Object.create(Node.prototype);
Leaf.prototype.constructor = Leaf;

extend(Leaf.prototype, {
    maxChildren: LEAF_MAX_CHILDREN,

    minChildren: LEAF_MIN_CHILDREN,

    delete(cmp, ownerID, key) {
        const idx = binSearch(this.keys, key, cmp);
        // Key was not found. No modifications needed.
        if (idx === -1) {
            return this;
        }

        const newLeaf = new Leaf({
            order: this.order,
            keys: withoutIdx(idx, this.keys),
            children: withoutIdx(idx, this.children),
        });

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
    merge(otherLeaf) {
        return new Leaf({
            order: this.order,
            keys: this.keys.concat(otherLeaf.keys),
            children: this.children.concat(otherLeaf.children),
        });
    },

    idxForKey(cmp, key) {
        return binarySearch.gte(this.keys, key, cmp);
    },

    insert(cmp, ownerID, key, value) {
        const idx = this.idxForKey(cmp, key);
        const alreadyHasKey = this.keys[idx] === key;

        let newKeys;
        let newChildren;

        if (!alreadyHasKey) {
            newKeys = insert(ownerID, idx, key, this.keys);
            newChildren = insert(ownerID, idx, value, this.children);
        } else {
            const existingValue = this.children[idx];
            if (existingValue === value) {
                return this;
            }

            newKeys = fastSet(idx, key, this.keys);
            newChildren = fastSet(idx, value, this.children);
        }

        const newLeaf = new Leaf({
            order: this.order,
            keys: newKeys,
            children: newChildren,
        });

        return newLeaf.shouldSplit()
            ? newLeaf.split()
            : newLeaf;
    },

    split() {
        const cutoff = median(this.keys.length);
        const smallestKeyInOther = this.keys[cutoff];

        const keypair = splitAt(cutoff, this.keys);
        const thisKeys = keypair[0];
        const otherKeys = keypair[1];

        const childrenPair = splitAt(cutoff, this.children);
        const thisChildren = childrenPair[0];
        const otherChildren = childrenPair[1];

        const other = new Leaf({
            order: this.order,
            keys: otherKeys,
            children: otherChildren,
        });

        const thisSplit = new Leaf({
            order: this.order,
            keys: thisKeys,
            children: thisChildren,
        });

        return [smallestKeyInOther, thisSplit, other];
    },

    smallestKey() {
        return this.keys[0];
    },

    stealFirstKeyFrom(rightSibling) {
        const stolenKey = rightSibling.keys[0];
        const stolenValue = rightSibling.children[0];

        // Note: mutative. If we're stealing a key,
        // it means this node was created during
        // the edit and can be mutated.
        this.keys = this.keys.concat(stolenKey);
        this.children = this.children.concat(stolenValue);

        const siblingWithoutFirstKey = rightSibling.tail();
        return [this, siblingWithoutFirstKey];
    },

    giveLastKeyTo(ownerID, rightSibling) {
        const keyToGive = this.keys[this.keys.length - 1];
        const valueToGive = this.children[this.children.length - 1];

        // Note: mutative. If we're giving a key,
        // it means the sibling node was created during
        // the edit and can be mutated.
        rightSibling.keys = unshift(ownerID, keyToGive, rightSibling.keys);
        rightSibling.children = unshift(ownerID, valueToGive, rightSibling.children);

        const thisWithoutLastKey = this.init();
        return [thisWithoutLastKey, rightSibling];
    },
});

function InternalNode(opts) {
    Node.call(this, opts);
}


const REPLACE = 'REPLACE';
const STEAL_KEY_FROM_LEFT = 'STEAL_KEY_FROM_LEFT';
const STEAL_KEY_FROM_RIGHT = 'STEAL_KEY_FROM_RIGHT';
const MERGE = 'MERGE';

export const DELETION_STRATEGIES = {
    STEAL_KEY_FROM_LEFT,
    STEAL_KEY_FROM_RIGHT,
    MERGE,
};

InternalNode.prototype = Object.create(Node.prototype);
InternalNode.prototype.constructor = InternalNode;

extend(InternalNode.prototype, {
    maxChildren: INTERNAL_MAX_CHILDREN,

    minChildren: INTERNAL_MIN_CHILDREN,

    merge(otherNode) {
        // We have ak + bk keys, and ac + bc children.
        // In a node, ac - ak === 1 (one less key than children).
        // Because (ac + bc) - (ak + bk) === 2, we need to add a key.
        // The key is the smallest key on the right node subtree.
        const toConcat = unshift(null, otherNode.smallestKey(), otherNode.keys);
        const newNode = new InternalNode({
            order: this.order,
            keys: this.keys.concat(toConcat),
            children: this.children.concat(otherNode.children),
        });
        return newNode;
    },

    chooseComplexDeletionStrategy(childIdx, newChild) {
        // When we need to merge, steal or give keys to
        // siblings -- this method returns the operation parameters,
        // which are: the left node, the right node, the index of
        // the left node in this nodes `children` array, and the
        // strategy to use (merge, steal from right, steal from left).

        if (newChild.satisfiesMinChildren()) {
            return {
                strategy: REPLACE,
            };
        }

        const hasRightSibling = childIdx + 1 < this.children.length;
        const hasLeftSibling = childIdx - 1 >= 0;

        const isLeaf = newChild.constructor === Leaf;

        const nullSibling = { size: 0 };

        const rightSibling = hasRightSibling
            ? this.children[childIdx + 1]
            : nullSibling;

        const leftSibling = hasLeftSibling
            ? this.children[childIdx - 1]
            : nullSibling;

        const minChildren = isLeaf
            ? LEAF_MIN_CHILDREN
            : INTERNAL_MIN_CHILDREN;

        let strategy;
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
                strategy,
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
                strategy,
            };
        }
    },

    delete(cmp, ownerID, key) {
        const childIdx = this.childIdxForKey(cmp, key);
        const origChild = this.children[childIdx];
        const child = origChild.delete(cmp, ownerID, key);

        if (origChild === child) return this;

        const strategyInfo = this.chooseComplexDeletionStrategy(childIdx, child);
        const strategy = strategyInfo.strategy;

        if (strategy === REPLACE) {
            return this.withReplacedChildren(childIdx, [child]);
        }

        const {
            leftNode,
            rightNode,
            leftNodeIdx,
        } = strategyInfo;

        if (strategy === MERGE) {
            return this.withMergedChildren(leftNodeIdx, leftNode, rightNode);
        }

        let newLeftNode;
        let newRightNode;
        if (strategy === STEAL_KEY_FROM_RIGHT) {
            const newNodes = leftNode.stealFirstKeyFrom(rightNode);
            newLeftNode = newNodes[0];
            newRightNode = newNodes[1];
        } else if (strategy === STEAL_KEY_FROM_LEFT) {
            const newNodes = leftNode.giveLastKeyTo(ownerID, rightNode);
            newLeftNode = newNodes[0];
            newRightNode = newNodes[1];
        }

        const withReplacedChildren = this.withReplacedChildren(
            leftNodeIdx,
            [newLeftNode, newRightNode]
        );

        // Key must be updated because of the child key theft.
        const keyIdxToReplace = leftNodeIdx;
        const newKey = newRightNode.smallestKey();

        withReplacedChildren.keys = fastSet(keyIdxToReplace, newKey, withReplacedChildren.keys);
        return withReplacedChildren;
    },

    withMergedChildren(leftChildIdx, leftNode, rightNode) {
        const mergedChild = leftNode.merge(rightNode);

        const keyIdxToPop = leftChildIdx;

        const newKeys = withoutIdx(keyIdxToPop, this.keys);

        const areLeftmostNodes = leftChildIdx === 0;

        if (!areLeftmostNodes) {
            newKeys[leftChildIdx - 1] = mergedChild.smallestKey();
        }

        const newChildren = fastArrayClone(this.children);
        newChildren.splice(leftChildIdx, 1);
        newChildren[leftChildIdx] = mergedChild;

        const withReplacedChild = new InternalNode({
            order: this.order,
            keys: newKeys,
            children: newChildren,
        });
        return withReplacedChild;
    },

    childIdxForKey(cmp, key) {
        return binarySearch.lte(this.keys, key, cmp) + 1;
    },

    stealFirstKeyFrom(rightSibling) {
        // Note that we mutate `this`.
        // Whenever we're stealing a first key,
        // it means this node was created during
        // the current update and can be mutated.
        const stolenValue = rightSibling.children[0];

        this.keys = this.keys.concat(rightSibling.smallestKey());
        this.children = this.children.concat(stolenValue);

        return [this, rightSibling.tail()];
    },

    giveLastKeyTo(ownerID, rightSibling) {
        // Steal last key-value pair from left node
        // const stolenKey = last(leftNode.keys);
        const stolenValue = last(this.children);
        rightSibling.keys = unshift(ownerID, rightSibling.smallestKey(), rightSibling.keys);
        rightSibling.children = unshift(ownerID, stolenValue, rightSibling.children);

        return [this.init(), rightSibling];
    },

    withReplacedChildren(idx, newChildren) {
        const replaced = fastArrayClone(this.children);
        for (let i = 0; i < newChildren.length; i++) {
            replaced[idx + i] = newChildren[i];
        }
        return new InternalNode({
            order: this.order,
            keys: this.keys,
            children: replaced,
        });
    },

    smallestKey() {
        let curr = this;
        while (curr.constructor !== Leaf) {
            curr = curr.children[0];
        }
        return curr.keys[0];
    },

    split() {
        const medianIdx = median(this.keys.length) - 1;

        const splitArr = takeIdxAndSplit(medianIdx, this.keys);
        const thisKeys = splitArr[0];
        const medianKey = splitArr[1];
        const otherKeys = splitArr[2];

        const childrenPair = splitAt(medianIdx + 1, this.children);
        const thisChildren = childrenPair[0];
        const otherChildren = childrenPair[1];

        const thisNode = new InternalNode({
            order: this.order,
            keys: thisKeys,
            children: thisChildren,
        });

        const otherNode = new InternalNode({
            order: this.order,
            keys: otherKeys,
            children: otherChildren,
        });

        return [medianKey, thisNode, otherNode];
    },

    withSplitChild(cmp, newKey, splitChild, newChild) {
        const insertNewKeyAt = internalInsertKeyAt(cmp, newKey, this.keys);
        const newKeys = insert(null, insertNewKeyAt, newKey, this.keys);

        const newChildren = insert(null, insertNewKeyAt + 1, newChild, this.children);
        // Replace the original child with the split one.
        newChildren[insertNewKeyAt] = splitChild;

        return new InternalNode({
            order: this.order,
            keys: newKeys,
            children: newChildren,
        });
    },

    insert(cmp, ownerID, key, value) {
        const childIdx = this.childIdxForKey(cmp, key);
        const child = this.children[childIdx];

        const newChild = child.insert(cmp, ownerID, key, value);

        if (child === newChild) return this;

        // Got new child.

        // Child was split on insertion.
        if (newChild.length === 3) {
            const splitArr = newChild;
            const medianKey = splitArr[0];
            const splitChild = splitArr[1];
            const _newChild = splitArr[2];

            const withSplitChild = this.withSplitChild(cmp, medianKey, splitChild, _newChild);
            return withSplitChild.shouldSplit()
                ? withSplitChild.split()
                : withSplitChild;
        }

        return this.withReplacedChildren(childIdx, [newChild]);
    },
});

export {
    Node,
    Leaf,
    InternalNode,
};

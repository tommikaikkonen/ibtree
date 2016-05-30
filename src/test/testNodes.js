import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {
    ORDER,
} from '../constants';
import {
    Node,
    Leaf,
    InternalNode,
    DELETION_STRATEGIES,
} from '../nodes';
import { defaultComparator } from '../index';
import {
    makeRef,
    isSet,
} from '../utils';
import {
    assertArrayShallowEquals,
} from './utils';

const cmp = defaultComparator;

chai.use(sinonChai);
const { expect } = chai;


// Checks that keys and children are shallowequal.
function nodesEqual(a, b) {
    expect(a.keys).to.have.lengthOf(b.keys.length);
    expect(a.children).to.have.lengthOf(b.children.length);

    a.keys.forEach((key, i) => {
        expect(key).to.equal(b.keys[i]);
    });

    a.children.forEach((key, i) => {
        expect(key).to.equal(b.children[i]);
    });
}


describe('Node', () => {
    it('constructor works', () => {
        const node = new Node();
        expect(node.children).to.deep.equal([]);
        expect(node.keys).to.deep.equal([]);
        expect(node.order).to.deep.equal(ORDER);
    });

    describe('methods', () => {
        let node;

        beforeEach(() => {
            node = new Node({
                keys: ['1', '2'],
                children: [1, 2, 3],
            });
        });

        it('size', () => {
            expect(node.size).to.equal(3);
        });

        it('satisfiesMinChildren', () => {
            node.minChildren = 2;
            expect(node.satisfiesMinChildren()).to.be.true;
            node.minChildren = 4;
            expect(node.satisfiesMinChildren()).to.be.false;
        });

        it('satisfiesMaxChildren', () => {
            node.maxChildren = 4;
            expect(node.satisfiesMaxChildren()).to.be.true;
            node.maxChildren = 2;
            expect(node.satisfiesMaxChildren()).to.be.false;
        });

        it('tail', () => {
            const tailNode = node.tail();
            assertArrayShallowEquals(tailNode.keys, ['2']);
            assertArrayShallowEquals(tailNode.children, [2, 3]);
            expect(tailNode.order).to.deep.equal(node.order);
        });

        it('init', () => {
            const tailNode = node.init();
            assertArrayShallowEquals(tailNode.keys, ['1']);
            assertArrayShallowEquals(tailNode.children, [1, 2]);
            expect(tailNode.order).to.deep.equal(node.order);
        });

        it('shouldSplit', () => {
            node.maxChildren = 2;
            expect(node.shouldSplit()).to.be.true;
            node.maxChildren = 4;
            expect(node.shouldSplit()).to.be.false;
        });
    });
});

describe('Leaf', () => {
    it('constructor works', () => {
        const node = new Leaf();
        expect(node.children).to.deep.equal([]);
        expect(node.keys).to.deep.equal([]);
        expect(node.order).to.deep.equal(ORDER);
    });

    describe('methods', () => {
        let leaf;
        let didChange;

        beforeEach(() => {
            leaf = new Leaf({
                keys: ['1', '2', '3'],
                children: [1, 2, 3],
            });

            didChange = makeRef(false);
        });

        it('delete', () => {
            const leafAfterDeletion = leaf.delete(cmp, null, didChange, '2');
            expect(isSet(didChange)).to.be.true;

            expect(leafAfterDeletion.keys).to.not.equal(leaf.keys);
            expect(leafAfterDeletion.children).to.not.equal(leaf.children);

            assertArrayShallowEquals(leafAfterDeletion.keys, ['1', '3']);
            assertArrayShallowEquals(leafAfterDeletion.children, [1, 3]);
        });

        it('delete when key doesn\'t exist', () => {
            const leafAfterDeletion = leaf.delete(cmp, null, didChange, '4');
            expect(isSet(didChange)).to.be.false;

            expect(leafAfterDeletion).to.equal(leaf);
            expect(leafAfterDeletion.keys).to.deep.equal(['1', '2', '3']);
            expect(leafAfterDeletion.children).to.deep.equal([1, 2, 3]);
        });

        it('merge', () => {
            const otherLeaf = new Leaf({
                keys: ['4', '5'],
                children: [4, 5],
            });
            const merged = leaf.merge(otherLeaf);

            expect(merged.keys).to.deep.equal(['1', '2', '3', '4', '5']);
            expect(merged.children).to.deep.equal([1, 2, 3, 4, 5]);
        });

        it('idxForKey', () => {
            const idx = leaf.idxForKey(cmp, '2');
            expect(idx).to.equal(1);
        });

        it('idxForKey - search key smaller than leaf keys', () => {
            const idx = leaf.idxForKey(cmp, '0');
            expect(idx).to.equal(0);
        });

        it('idxForKey - search key larger than leaf keys', () => {
            const idx = leaf.idxForKey(cmp, '4');
            expect(idx).to.equal(3);
        });

        it('split', () => {
            const otherLeaf = new Leaf({
                keys: ['4', '5'],
                children: [4, 5],
            });

            const merged = leaf.merge(otherLeaf);

            const [key, firstLeaf, secondLeaf] = merged.split();

            expect(key).to.equal('4');
            assertArrayShallowEquals(firstLeaf.keys, ['1', '2', '3']);
            assertArrayShallowEquals(firstLeaf.children, [1, 2, 3]);

            assertArrayShallowEquals(secondLeaf.keys, ['4', '5']);
            assertArrayShallowEquals(secondLeaf.children, [4, 5]);
        });

        it('insert', () => {
            const value = 999;

            // '25' should be inserted between '2' and '3'
            // due to lexicographic order.
            const inserted = leaf.insert(cmp, null, didChange, '25', value);

            assertArrayShallowEquals(inserted.keys, ['1', '2', '25', '3']);
            assertArrayShallowEquals(inserted.children, [1, 2, value, 3]);
            expect(isSet(didChange)).to.be.true;
        });

        it('insert smallest key', () => {
            const value = 0;
            const inserted = leaf.insert(cmp, null, didChange, '0', value);

            assertArrayShallowEquals(inserted.keys, ['0', '1', '2', '3']);
            assertArrayShallowEquals(inserted.children, [value, 1, 2, 3]);
            expect(isSet(didChange)).to.be.true;
        });

        it('insert largest key', () => {
            const value = 4;
            const inserted = leaf.insert(cmp, null, didChange, '4', value);

            assertArrayShallowEquals(inserted.keys, ['1', '2', '3', '4']);
            assertArrayShallowEquals(inserted.children, [1, 2, 3, value]);
            expect(isSet(didChange)).to.be.true;
        });

        it('insert - key already exists', () => {
            const value = 999;
            const inserted = leaf.insert(cmp, null, didChange, '2', value);

            expect(inserted).to.not.equal(leaf);
            assertArrayShallowEquals(inserted.keys, ['1', '2', '3']);
            assertArrayShallowEquals(inserted.children, [1, value, 3]);
            expect(isSet(didChange)).to.be.true;
        });

        it('insert - key already exists and has equal value', () => {
            const value = 2;
            const inserted = leaf.insert(cmp, null, didChange, '2', value);
            expect(inserted).to.equal(leaf);
            expect(isSet(didChange)).to.be.false;
        });

        it('insert - node exceeds maximum children', () => {
            const origShouldSplit = Node.prototype.shouldSplit;
            Node.prototype.shouldSplit = () => true;

            const insertedKey = '25';
            const value = 999;
            const [key, firstLeaf, secondLeaf] = leaf.insert(
                cmp, null, didChange, insertedKey, value);

            expect(isSet(didChange)).to.be.true;

            expect(key).to.equal(insertedKey);
            assertArrayShallowEquals(firstLeaf.keys, ['1', '2']);
            assertArrayShallowEquals(firstLeaf.children, [1, 2]);

            assertArrayShallowEquals(secondLeaf.keys, [insertedKey, '3']);
            assertArrayShallowEquals(secondLeaf.children, [value, 3]);

            Node.prototype.shouldSplit = origShouldSplit;
        });

        describe('rearrangement', () => {
            let left;
            let right;

            beforeEach(() => {
                left = new Leaf({
                    keys: [1, 2],
                    children: [1, 2],
                });
                right = new Leaf({
                    keys: [3, 4],
                    children: [3, 4],
                });
            });

            it('stealFirstKeyFrom', () => {
                const [newLeft, newRight] = left.stealFirstKeyFrom(null, right);

                // This operation mutates `left`.

                expect(newLeft).to.equal(left);
                assertArrayShallowEquals(newLeft.keys, [1, 2, 3]);
                assertArrayShallowEquals(newLeft.children, [1, 2, 3]);

                expect(newRight).not.to.equal(right);
                assertArrayShallowEquals(newRight.keys, [4]);
                assertArrayShallowEquals(newRight.children, [4]);
            });

            it('giveLastKeyTo', () => {
                const [newLeft, newRight] = left.giveLastKeyTo(null, right);

                // This operation mutates `right`.

                expect(newRight).to.equal(right);
                assertArrayShallowEquals(newRight.keys, [2, 3, 4]);
                assertArrayShallowEquals(newRight.children, [2, 3, 4]);

                expect(newLeft).not.to.equal(left);
                assertArrayShallowEquals(newLeft.keys, [1]);
                assertArrayShallowEquals(newLeft.children, [1]);
            });
        });
    });
});

describe('InternalNode', () => {
    it('constructor works', () => {
        const node = new InternalNode();
        expect(node.children).to.deep.equal([]);
        expect(node.keys).to.deep.equal([]);
        expect(node.order).to.deep.equal(ORDER);
    });

    describe('methods', () => {
        let node;

        beforeEach(() => {
            node = new InternalNode({
                keys: ['2', '4', '6'],
                children: [{ val: 1 }, { val: 3 }, { val: 5 }, { val: 7 }],
            });
        });

        it('withReplacedChildren', () => {
            const replaced = node.withReplacedChildren(null, 1, ['first', 'second']);
            expect(replaced.keys).to.equal(node.keys);
            expect(replaced.children[0]).to.equal(node.children[0]);
            expect(replaced.children[1]).to.equal('first');
            expect(replaced.children[2]).to.equal('second');
            expect(replaced.children[3]).to.equal(node.children[3]);
        });

        it('smallestKey', () => {
            node.children[0] = new InternalNode({
                keys: ['1'],
                children: [
                    new Leaf({ keys: ['0', '05'], children: [0, 0.5] }),
                    new Leaf({ keys: ['1'], children: [1] }),
                ],
            });

            expect(node.smallestKey()).to.equal('0');
        });

        it('childIdxForKey', () => {
            const idx = node.childIdxForKey(cmp, '2');
            expect(idx).to.equal(1);
        });

        it('childIdxForKey - between two keys', () => {
            const idx = node.childIdxForKey(cmp, '3');
            expect(idx).to.equal(1);
        });

        it('childIdxForKey - search key smaller than all keys', () => {
            const idx = node.childIdxForKey(cmp, '1');
            expect(idx).to.equal(0);
        });

        it('childIdxForKey - search key larger than all keys', () => {
            const idx = node.childIdxForKey(cmp, '7');
            expect(idx).to.equal(3);
        });

        it('merge', () => {
            const otherNode = new InternalNode({
                keys: ['8'],
                children: [
                    new Leaf({ keys: ['7'], children: [7] }),
                    new Leaf({ keys: ['8'], children: [8] }),
                ],
            });

            const merged = node.merge(otherNode);

            expect(merged.keys).to.deep.equal(['2', '4', '6', '7', '8']);
            expect(merged.children).to.have.lengthOf(6);

            expect(merged.children[0]).to.equal(node.children[0]);
            expect(merged.children[1]).to.equal(node.children[1]);
            expect(merged.children[2]).to.equal(node.children[2]);
            expect(merged.children[3]).to.equal(node.children[3]);
            expect(merged.children[4]).to.equal(otherNode.children[0]);
            expect(merged.children[5]).to.equal(otherNode.children[1]);
        });

        it('split', () => {
            const [key, leftNode, rightNode] = node.split();
            expect(key).to.equal('4');

            assertArrayShallowEquals(leftNode.keys, ['2']);
            expect(leftNode.children).to.have.lengthOf(2);
            expect(leftNode.children[0]).to.equal(node.children[0]);
            expect(leftNode.children[1]).to.equal(node.children[1]);

            assertArrayShallowEquals(rightNode.keys, ['6']);
            expect(rightNode.children).to.have.lengthOf(2);
            expect(rightNode.children[0]).to.equal(node.children[2]);
            expect(rightNode.children[1]).to.equal(node.children[3]);
        });

        it('withSplitChild', () => {
            const splitKey = '5';
            const origChild = {};
            const splitChild = {};

            const result = node.withSplitChild(cmp, null, splitKey, origChild, splitChild);

            assertArrayShallowEquals(result.keys, ['2', '4', '5', '6']);

            expect(result.children).to.have.lengthOf(node.children.length + 1);
            expect(result.children[0]).to.equal(node.children[0]);
            expect(result.children[1]).to.equal(node.children[1]);
            expect(result.children[2]).to.equal(origChild);
            expect(result.children[3]).to.equal(splitChild);
            expect(result.children[4]).to.equal(node.children[3]);
        });

        describe('insert', () => {
            let didChange;

            beforeEach(() => {
                node = new InternalNode({
                    keys: ['2', '4', '6'],
                    children: [
                        new Leaf({
                            keys: ['0', '1'],
                            children: [0, 1],
                        }),
                        new Leaf({
                            keys: ['2', '3'],
                            children: [2, 3],
                        }),
                        new Leaf({
                            keys: ['4', '5'],
                            children: [4, 5],
                        }),
                        new Leaf({
                            keys: ['6', '7'],
                            children: [6, 7],
                        }),
                    ],
                });

                didChange = makeRef(false);
            });

            it('basic case', () => {
                const childInsertSpy = sinon.spy(node.children[1], 'insert');
                const value = 999;
                const inserted = node.insert(cmp, null, didChange, '3', value);

                expect(childInsertSpy).to.have.been.calledWith(cmp, null, didChange, '3', value);

                expect(inserted.keys).to.equal(node.keys);
                expect(inserted.children).to.have.lengthOf(node.children.length);

                expect(inserted.children[0]).to.equal(node.children[0]);
                expect(inserted.children[1]).not.to.equal(node.children[1]);
                expect(inserted.children[2]).to.equal(node.children[2]);
                expect(inserted.children[3]).to.equal(node.children[3]);
            });

            it('returns the same child (no changes in child)', () => {
                const inserted = node.insert(cmp, null, didChange, '2', 2);
                expect(inserted).to.equal(node);
                expect(isSet(didChange)).to.be.false;
            });

            it('child is split', () => {
                const origShouldSplit = Leaf.prototype.shouldSplit;
                Leaf.prototype.shouldSplit = () => true;

                const inserted = node.insert(cmp, null, didChange, '25', 2.5);
                expect(isSet(didChange)).to.be.true;

                expect(inserted.keys).to.have.lengthOf(node.keys.length + 1);
                assertArrayShallowEquals(inserted.keys, ['2', '3', '4', '6']);

                expect(inserted.children).to.have.lengthOf(node.children.length + 1);
                expect(inserted.children[0]).to.equal(node.children[0]);

                assertArrayShallowEquals(inserted.children[1].keys, ['2', '25']);
                assertArrayShallowEquals(inserted.children[1].children, [2, 2.5]);

                assertArrayShallowEquals(inserted.children[2].keys, ['3']);
                assertArrayShallowEquals(inserted.children[2].children, [3]);

                expect(inserted.children[3]).to.equal(node.children[2]);
                expect(inserted.children[4]).to.equal(node.children[3]);

                Leaf.prototype.shouldSplit = origShouldSplit;
            });
        });

        describe('rearrangement', () => {
            let left;
            let right;
            beforeEach(() => {
                left = new InternalNode({
                    keys: [2, 4],
                    children: [
                        new Leaf({
                            keys: [0, 1],
                            children: [0, 1],
                        }),
                        new Leaf({
                            keys: [2, 3],
                            children: [2, 3],
                        }),
                        new Leaf({
                            keys: [4],
                            children: [4],
                        }),
                    ],
                });
                right = new InternalNode({
                    keys: [6, 8],
                    children: [
                        new Leaf({
                            keys: [5],
                            children: [5],
                        }),
                        new Leaf({
                            keys: [6, 7],
                            children: [6, 7],
                        }),
                        new Leaf({
                            keys: [8, 9],
                            children: [8, 9],
                        }),
                    ],
                });
            });

            it('withMergedChildren', () => {
                const mergeSpy = sinon.spy(left, 'merge');

                const parentNode = new InternalNode({
                    keys: [0, 5, 10],
                    children: [{}, left, right, {}],
                });

                // Usually you would supply a new left or right
                // node but for this test it doesn't matter.
                const newParent = parentNode.withMergedChildren(null, 1, left, right);

                expect(mergeSpy).to.have.been.calledOnce;
                const call = mergeSpy.firstCall;
                expect(call.thisValue).to.equal(left);
                expect(call).to.have.been.calledWith(right);
                const mergedChild = call.returnValue;

                assertArrayShallowEquals(newParent.keys, [0, 10]);
                expect(newParent.children[0]).to.equal(parentNode.children[0]);
                expect(newParent.children[1]).to.equal(mergedChild);
                expect(newParent.children[2]).to.equal(parentNode.children[3]);
            });

            it('withMergedChildren - leftmost nodes', () => {
                const mergeSpy = sinon.spy(left, 'merge');

                const parentNode = new InternalNode({
                    keys: [5, 10],
                    children: [left, right, {}],
                });

                // Usually you would supply a new left or right
                // node but for this test it doesn't matter.
                const newParent = parentNode.withMergedChildren(null, 0, left, right);

                expect(mergeSpy).to.have.been.calledOnce;
                const call = mergeSpy.firstCall;
                expect(call.thisValue).to.equal(left);
                expect(call).to.have.been.calledWith(right);
                const mergedChild = call.returnValue;

                assertArrayShallowEquals(newParent.keys, [10]);
                expect(newParent.children[0]).to.equal(mergedChild);
                expect(newParent.children[1]).to.equal(parentNode.children[2]);
            });

            it('stealFirstKeyFrom', () => {
                const [newLeft, newRight] = left.stealFirstKeyFrom(null, right);

                // this operation mutates `left`.
                expect(newLeft).to.equal(left);
                expect(newRight).not.to.equal(right);

                assertArrayShallowEquals(newLeft.keys, [2, 4, 5]);
                expect(newLeft.children).to.have.lengthOf(4);
                expect(newLeft.children[3]).to.equal(right.children[0]);

                assertArrayShallowEquals(newRight.keys, [8]);
                expect(newRight.children).to.have.lengthOf(2);
            });

            it('giveLastKeyTo', () => {
                const initialRightChildren = right.children;
                const initialLeftChildren = left.children;
                const [newLeft, newRight] = left.giveLastKeyTo(null, right);

                // This operation mutatest `right`.
                expect(newRight).to.equal(right);
                expect(newLeft).to.not.equal(left);

                assertArrayShallowEquals(newLeft.keys, [2]);
                expect(newLeft.children).to.have.lengthOf(2);
                expect(newLeft.children[0]).to.equal(left.children[0]);
                expect(newLeft.children[1]).to.equal(left.children[1]);

                assertArrayShallowEquals(newRight.keys, [5, 6, 8]);
                expect(newRight.children).to.have.lengthOf(4);
                expect(newRight.children[0]).to.equal(initialLeftChildren[2]);
                expect(newRight.children[1]).to.equal(initialRightChildren[0]);
                expect(newRight.children[2]).to.equal(initialRightChildren[1]);
                expect(newRight.children[3]).to.equal(initialRightChildren[2]);
            });
        });

        describe('delete', () => {
            let didChange;
            beforeEach(() => {
                node = new InternalNode({
                    keys: ['2', '4', '6'],
                    children: [
                        new Leaf({
                            keys: ['0', '1'],
                            children: [0, 1],
                        }),
                        new Leaf({
                            keys: ['2', '3'],
                            children: [2, 3],
                        }),
                        new Leaf({
                            keys: ['4', '5'],
                            children: [4, 5],
                        }),
                        new Leaf({
                            keys: ['6', '7'],
                            children: [6, 7],
                        }),
                    ],
                });
                didChange = makeRef(false);
            });

            it('normal case', () => {
                // Stop from merging
                const _stub = sinon.stub(Leaf.prototype, 'satisfiesMinChildren');
                _stub.returns(true);

                const newNode = node.delete(cmp, null, didChange, '2');

                expect(isSet(didChange)).to.be.true;

                expect(newNode.children[0]).to.equal(node.children[0]);
                const newLeaf = newNode.children[1];
                assertArrayShallowEquals(newLeaf.keys, ['3']);
                assertArrayShallowEquals(newLeaf.children, [3]);
                expect(newNode.children[2]).to.equal(node.children[2]);
                expect(newNode.children[3]).to.equal(node.children[3]);

                _stub.restore();
            });

            it('key doesn\'t exist', () => {
                const _stub = sinon.stub(Leaf.prototype, 'satisfiesMinChildren');
                _stub.returns(true);

                const newNode = node.delete(cmp, null, didChange, '10');
                expect(isSet(didChange)).to.be.false;

                expect(newNode).to.equal(node);
                _stub.restore();
            });

            it('merge right leaf', () => {
                // Force merging
                const _stub = sinon.stub(Leaf.prototype, 'satisfiesMinChildren');
                _stub.returns(false);

                // When left and right sibling leafs are of the same size,
                // the right one is selected for merging.
                const newNode = node.delete(cmp, null, didChange, '2');
                expect(isSet(didChange)).to.be.true;

                assertArrayShallowEquals(newNode.keys, ['3', '6']);

                const newChildren = newNode.children;

                expect(newChildren).to.have.lengthOf(node.children.length - 1);
                expect(newChildren[0]).to.equal(node.children[0]);
                assertArrayShallowEquals(
                    newChildren[1].keys, ['3', '4', '5']);
                assertArrayShallowEquals(
                    newChildren[1].children, [3, 4, 5]);
                expect(newChildren[2]).to.equal(node.children[3]);

                _stub.restore();
            });

            it('merge left leaf', () => {
                // Force merging
                const _stub = sinon.stub(Leaf.prototype, 'satisfiesMinChildren');
                _stub.returns(false);

                // Deletes from rightmost leaf - will merge to left one.
                const newNode = node.delete(cmp, null, didChange, '6');

                expect(isSet(didChange)).to.be.true;
                assertArrayShallowEquals(newNode.keys, ['2', '4']);

                expect(newNode.children).to.have.lengthOf(node.children.length - 1);
                expect(newNode.children[0]).to.equal(node.children[0]);
                expect(newNode.children[1]).to.equal(node.children[1]);
                assertArrayShallowEquals(
                    newNode.children[2].keys, ['4', '5', '7']);
                assertArrayShallowEquals(
                    newNode.children[2].children, [4, 5, 7]);

                _stub.restore();
            });

            it('steal key from left leaf', () => {
                // 3 was deleted
                const newLeaf = new Leaf({
                    keys: ['2'],
                    children: [2],
                });

                newLeaf.satisfiesMinChildren = () => false;

                // force stealing from left
                sinon.stub(node, 'chooseComplexDeletionStrategy')
                    .returns({
                        leftNodeIdx: 0,
                        rightNode: newLeaf,
                        leftNode: node.children[0],
                        strategy: DELETION_STRATEGIES.STEAL_KEY_FROM_LEFT,
                    });

                const newNode = node.delete(cmp, null, didChange, '3');
                expect(isSet(didChange)).to.be.true;

                assertArrayShallowEquals(newNode.keys, ['1', '4', '6']);
                assertArrayShallowEquals(newNode.children[0].keys, ['0']);
                assertArrayShallowEquals(newNode.children[1].keys, ['1', '2']);
            });

            it('steal key from right leaf', () => {
                // 3 was deleted
                const newLeaf = new Leaf({
                    keys: ['2'],
                    children: [2],
                });

                newLeaf.satisfiesMinChildren = () => false;

                // force stealing from left
                sinon.stub(node, 'chooseComplexDeletionStrategy')
                    .returns({
                        leftNodeIdx: 1,
                        leftNode: newLeaf,
                        rightNode: node.children[2],
                        strategy: DELETION_STRATEGIES.STEAL_KEY_FROM_RIGHT,
                    });

                const newNode = node.delete(cmp, null, didChange, '3');
                expect(isSet(didChange)).to.be.true;

                assertArrayShallowEquals(newNode.keys, ['2', '5', '6']);
                assertArrayShallowEquals(newNode.children[1].keys, ['2', '4']);
                assertArrayShallowEquals(newNode.children[2].keys, ['5']);
            });
        });
    });
});

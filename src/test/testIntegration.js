import head from 'ramda/src/head';
import range from 'ramda/src/range';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import random from 'lodash/random';
import deepFreeze from 'deep-freeze';
import {
    LEAF_MIN_CHILDREN,
    LEAF_MAX_CHILDREN,
    INTERNAL_MIN_CHILDREN,
    INTERNAL_MAX_CHILDREN,
} from '../constants';
import {
    BTMap,
} from '../index';

chai.use(sinonChai);
const { expect } = chai;

const ASSERT_MARGIN = 1;

function assertTreeOrder(order, tree) {
    if (tree.size < order) return;

    let rootVisited = false;
    tree.visit(node => {
        if (!rootVisited) {
            if (node.children) {
                expect(node.children.length).to.be.at.least(2);
                expect(node.children.length).to.be.at.most(INTERNAL_MAX_CHILDREN);
            }
            rootVisited = true;
            return;
        }
        if (node.children) {
            expect(node.children.length).to.be.at.least(
                INTERNAL_MIN_CHILDREN - ASSERT_MARGIN,
                'internal min children check failed'
            );
            expect(node.children.length).to.be.at.most(
                INTERNAL_MAX_CHILDREN,
                'internal max children check failed'
            );
        } else {
            expect(node.values.length).to.be.at.least(
                LEAF_MIN_CHILDREN - ASSERT_MARGIN,
                'leaf min children check failed'
            );
            expect(node.values.length).to.be.at.most(
                LEAF_MAX_CHILDREN,
                'leaf max children check failed'
            );
        }
    });
}

// const testSizes = range(0, 500);
// const loops = range(0, 10);
const testSizes = range(0, 500);
testSizes.unshift(0, 1, 2, 3);
const loops = range(0, 10);

loops.forEach(() => {
    if (!testSizes.length) return;
    const testSizeRanIdx = random(0, testSizes.length - 1);

    const testSize = testSizes[testSizeRanIdx];
    testSizes.splice(testSizeRanIdx, 1);

    describe(`Integration test. Size: ${testSize}`, () => {
        describe('bplus Tree', () => {
            it('init', () => {
                const tree = new BTMap();
                deepFreeze(tree);

                let _tree = tree;
                for (let i = 0; i < testSize; i++) {
                    assertTreeOrder(tree.order, tree);
                    _tree = _tree.set(i, `value${i}`);
                    deepFreeze(tree);
                }

                assertTreeOrder(tree.order, tree);

                for (let i = 0; i < testSize; i++) {
                    expect(_tree.has(i)).to.be.true;
                    expect(_tree.get(i)).to.equal(`value${i}`, `get ${i}`);
                }

                expect(_tree.size).to.equal(testSize);
            });

            it('specifying extractor works', () => {
                const data = new Array(testSize);
                for (let i = 0; i < testSize; i++) {
                    const item = { value: i };
                    data[i] = [item, item];
                }

                const tree = BTMap.from(data, {
                    extractor: item => item.value,
                });

                for (let i = 0; i < testSize; i++) {
                    expect(tree.has({ value: i })).to.be.true;
                }
            });

            it('bulkload works', () => {
                const data = new Array(testSize);
                for (let i = 0; i < testSize; i++) {
                    data[i] = [i, `value${i}`];
                }

                const tree = BTMap.from(data);

                assertTreeOrder(tree.order, tree);
                for (let i = 0; i < testSize; i++) {
                    expect(tree.get(i)).to.equal(`value${i}`);
                }
                expect(tree.size).to.equal(testSize);
            });

            describe('transient', () => {
                it('setting values works', () => {
                    let tree = new BTMap();
                    deepFreeze(tree);

                    tree = tree.asMutable();
                    for (let i = 0; i < testSize; i++) {
                        tree.set(i, `value${i}`);
                        assertTreeOrder(tree.order, tree);
                    }
                    const result = tree.asImmutable();
                    expect(result.size).to.equal(testSize);

                    for (let i = 0; i < testSize; i++) {
                        expect(tree.get(i)).to.equal(`value${i}`);
                    }
                });

                it('deleting values works', () => {
                    const data = new Array(testSize);
                    for (let i = 0; i < testSize; i++) {
                        data[i] = [i, `value${i}`];
                    }

                    let tree = BTMap.from(data);
                    deepFreeze(tree);

                    tree = tree.asMutable();
                    for (let i = 0; i < testSize; i++) {
                        tree.delete(i);
                        assertTreeOrder(tree.order, tree);
                    }
                    const result = tree.asImmutable();
                    expect(result.size).to.equal(0);
                });

                it('withMutations works', () => {
                    const data = new Array(testSize);
                    for (let i = 0; i < testSize; i++) {
                        data[i] = [i, `value${i}`];
                    }
                    let tree = new BTMap();
                    deepFreeze(tree);

                    tree = tree.withMutations(_t => {
                        for (let i = 0; i < testSize; i++) {
                            _t.set(i, `value${i}`);
                        }
                    });
                    expect(tree.size).to.equal(testSize);

                    for (let i = 0; i < testSize; i++) {
                        expect(tree.get(i)).to.equal(`value${i}`);
                    }
                });
            });

            describe('iteration', () => {
                const data = [];
                for (let i = 0; i < testSize; i++) {
                    data.push([i, `value${i}`]);
                }
                let tree;

                beforeEach(() => {
                    tree = BTMap.from(data);
                });

                it('correctly iterates', () => {
                    const iter = tree.values();
                    let curr = iter.next();

                    if (testSize === 0) {
                        expect(curr.done).to.be.true;
                    }

                    let i = 0;
                    while (i < testSize) {
                        expect(curr.value).to.equal(`value${i}`);
                        i++;
                        curr = iter.next();
                    }
                    expect(curr.done).to.be.true;
                    let n = 0;
                    for (const val of tree) {
                        expect(val).to.deep.equal([n, `value${n}`]);
                        n++;
                    }
                });
            });

            describe('range search', () => {
                it('works', () => {
                    const data = [];
                    for (let i = 0; i < testSize; i++) {
                        data.push([i, `value${i}`]);
                    }

                    const tree = BTMap.from(data);

                    assertTreeOrder(tree.order, tree);

                    if (testSize === 0) {
                        expect(Array.from(tree.between(0, 10)).length).to.equal(0);
                    } else {
                        let end = testSize - 2;
                        const start = 0;
                        if (end < start) {
                            end = start;
                        }
                        const n = end - start + 1;
                        const result = Array.from(tree.between(start, end));
                        expect(result.length).to.equal(n);
                    }
                });

                it('works with exclusive specification', () => {
                    const data = [];
                    for (let i = 0; i < testSize; i++) {
                        data.push([i, `value${i}`]);
                    }

                    const tree = BTMap.from(data);

                    assertTreeOrder(tree.order, tree);

                    if (testSize === 0) {
                        expect(Array.from(tree.between({
                            from: 0,
                            to: 10,
                            fromInclusive: false,
                            toInclusive: false,
                        })).length).to.equal(0);
                    } else {
                        let end = testSize - 2;
                        const start = 0;
                        if (end < start) {
                            end = start;
                        }
                        const n = end - start + 1;
                        const result = Array.from(tree.between({
                            from: start,
                            to: end,
                            fromInclusive: false,
                            toInclusive: false,
                        }));
                        expect(result.length).to.equal(n - 2);
                    }
                });

                it('works when boundaries are outside keys', () => {
                    const data = [];
                    for (let i = 0; i < testSize; i++) {
                        data.push([i, `value${i}`]);
                    }

                    const tree = BTMap.from(data);

                    assertTreeOrder(tree.order, tree);

                    const result = Array.from(tree.between(-10, testSize + 10));
                    expect(result).to.have.length(testSize);
                });

                it('works in reverse when boundaries are outside keys', () => {
                    const data = [];
                    for (let i = 0; i < testSize; i++) {
                        data.push([i, `value${i}`]);
                    }

                    const tree = BTMap.from(data);

                    assertTreeOrder(tree.order, tree);

                    const result = Array.from(tree.between(testSize + 10, -10));
                    expect(result).to.have.length(testSize);
                });

                it('both values outside key range returns empty iterator', () => {
                    const data = [];
                    for (let i = 0; i < testSize; i++) {
                        data.push([i, `value${i}`]);
                    }

                    const tree = BTMap.from(data);

                    assertTreeOrder(tree.order, tree);

                    const result = Array.from(tree.between(testSize + 10, testSize + 15));
                    expect(result).to.have.lengthOf(0);
                });

                it('works in reverse', () => {
                    const data = [];
                    for (let i = 0; i < testSize; i++) {
                        data.push([i, `value${i}`]);
                    }

                    const tree = BTMap.from(data);

                    assertTreeOrder(tree.order, tree);

                    if (testSize === 0) {
                        expect(Array.from(tree.between(10, 0)).length).to.equal(0);
                    } else {
                        let end = testSize - 2;
                        const start = 0;
                        if (end < start) {
                            end = start;
                        }
                        const n = end - start + 1;
                        const result = Array.from(tree.between(start, end));
                        const reverseResult = Array.from(tree.between(end, start));

                        const _resultReversed = result.slice();
                        _resultReversed.reverse();
                        expect(_resultReversed).to.deep.equal(reverseResult);
                        expect(result.length).to.equal(n);
                        expect(reverseResult.length).to.equal(n);
                    }
                });
            });

            describe('delete', function () {
                this.timeout(5000);

                const data = new Array(testSize);
                for (let i = 0; i < testSize; i++) {
                    data[i] = [i, `value${i}`];
                }
                let tree;

                beforeEach(() => {
                    tree = BTMap.from(data);
                    deepFreeze(tree);
                });

                it('correctly deletes', () => {
                    const keysToDelete = data.map(head);
                    keysToDelete.forEach(key => {
                        assertTreeOrder(tree.order, tree);
                        tree = tree.delete(key);
                        deepFreeze(tree);
                    });
                    expect(tree.root.size).to.equal(0);
                    expect(tree.size).to.equal(0);
                });

                it('correctly deletes from right to left', () => {
                    const keysToDelete = data.map(head).reverse();

                    keysToDelete.forEach(key => {
                        assertTreeOrder(tree.order, tree);
                        tree = tree.delete(key);
                        deepFreeze(tree);
                    });
                    expect(tree.root.size).to.equal(0);
                    expect(tree.size).to.equal(0);
                });

                it('correctly deletes on random delete order', () => {
                    const keysToDelete = data.map(head);
                    while (keysToDelete.length) {
                        assertTreeOrder(tree.order, tree);
                        const randomIdx = random(0, keysToDelete.length - 1);
                        const key = keysToDelete[randomIdx];
                        keysToDelete.splice(randomIdx, 1);
                        tree = tree.delete(key);
                        deepFreeze(tree);
                    }
                    expect(tree.root.size).to.equal(0);
                    expect(tree.size).to.equal(0);
                });
            });
        });
    });
});

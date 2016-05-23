import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {
    BTMap,
    BTSet,
    defaultComparator,
    makeComparator,
} from '../index';
import {
    Leaf,
    InternalNode,
} from '../nodes';
import {
    Path,
} from '../path';
import {
    ORDER,
    MIN_ROOT_CHILDREN,
} from '../constants';

chai.use(sinonChai);
const { expect } = chai;

function assertEmptyIterator(iterator) {
    expect(iterator.next).to.be.a.function;
    expect(iterator.next()).to.deep.equal({ done: true });
}

describe('BTree', () => {
    describe('constructor', () => {
        it('works without arguments', () => {
            const tree = new BTMap();
            expect(tree.order).to.equal(ORDER);
            expect(tree.comparator).to.equal(defaultComparator);
            expect(tree.size).to.equal(0);
            expect(tree.height).to.equal(0);
            expect(tree.extractor).to.be.undefined;

            expect(tree.root).to.be.an.instanceOf(Leaf);
            expect(tree.root.order).to.equal(ORDER);
        });

        it('works with a custom comparator', () => {
            const cmp = (a, b) => 0;
            const tree = new BTMap({ comparator: cmp });
            expect(tree.comparator).to.equal(cmp);
        });

        it('works with a custom extractor', () => {
            const extractor = item => item.value;
            const tree = new BTMap({ extractor });
            expect(tree.extractor).to.equal(extractor);
        });
    });

    describe('methods', () => {
        let tree;

        beforeEach(() => {
            tree = BTMap.from([[1, 1], [2, 2], [3, 3]]);
        });

        it('has', () => {
            const searchSpy = sinon.spy(tree, 'search');

            expect(tree.has(0)).to.be.false;
            expect(searchSpy).to.have.been.calledWith(tree.comparator, 0);

            expect(tree.has(1)).to.be.true;
            expect(tree.has(2)).to.be.true;
            expect(tree.has(3)).to.be.true;
            expect(tree.has(4)).to.be.false;
        });

        it('get', () => {
            const searchSpy = sinon.spy(tree, 'search');

            expect(tree.get(0)).to.be.undefined;

            expect(searchSpy).to.have.been.calledWith(tree.comparator, 0);

            expect(tree.get(1)).to.equal(1);
            expect(tree.get(2)).to.equal(2);
            expect(tree.get(3)).to.equal(3);
            expect(tree.get(4)).to.be.undefined;
        });

        it('add', () => {
            const setSpy = sinon.spy(tree, 'set');

            const initialTree = tree;

            tree = tree.add(4);
            expect(setSpy).to.have.been.calledWith(4, 4);
            expect(tree).to.not.equal(initialTree);
            expect(tree.size).to.equal(4);
        });

        it('set', () => {
            const withFour = tree.set(4, 4);
            expect(withFour).not.to.equal(tree);
            expect(withFour.size).to.equal(tree.size + 1);
            expect(withFour.height).to.equal(tree.height);
            expect(withFour.get(4)).to.equal(4);
        });

        it('set with root splitting', () => {
            const insertStub = sinon.stub(tree.root, 'insert');
            const risingKey = 'key';
            const leftChild = {};
            const rightChild = {};
            insertStub.returns([risingKey, leftChild, rightChild]);

            const withFour = tree.set(4, 4);
            expect(insertStub).to.have.been.calledWith(tree.comparator, 4, 4);
            expect(withFour.height).to.equal(tree.height + 1);
            expect(withFour.size).to.equal(tree.size + 1);

            expect(withFour.root.keys[0]).to.equal(risingKey);
            expect(withFour.root.children[0]).to.equal(leftChild);
            expect(withFour.root.children[1]).to.equal(rightChild);
        });

        it('set without modifications', () => {
            const insertStub = sinon.stub(tree.root, 'insert');
            insertStub.returns(tree.root);

            const sameTree = tree.set(3, 3);
            expect(sameTree).to.equal(tree);
        });


        it('clear', () => {
            const cleared = tree.clear();
            expect(cleared.size).to.equal(0);
            expect(cleared.height).to.equal(0);
            expect(cleared.root).not.to.equal(tree.root);
        });

        it('clear empty tree', () => {
            const emptyTree = new BTMap();
            const cleared = emptyTree.clear();
            expect(cleared.size).to.equal(0);
            expect(cleared.height).to.equal(0);
            expect(cleared.root).not.to.equal(tree.root);
        });

        it('delete', () => {
            const deleteSpy = sinon.spy(tree.root, 'delete');

            const withoutTwo = tree.delete(2);

            expect(deleteSpy).to.have.been.calledWith(tree.comparator, 2);
            expect(withoutTwo).to.not.equal(tree);
            expect(withoutTwo.size).to.equal(tree.size - 1);
            expect(withoutTwo.height).to.equal(tree.height);
        });

        it('delete to empty tree', () => {
            tree = BTMap.from([[1, 1]]);
            const deleteSpy = sinon.spy(tree.root, 'delete');

            const empty = tree.delete(1);
            expect(deleteSpy).to.have.been.calledWith(tree.comparator, 1);

            expect(empty.size).to.equal(0);
            expect(empty.height).to.equal(tree.height);
        });

        it('delete with collapsing root', () => {
            const rootNode = new InternalNode({
                keys: [2],
                children: [
                    new Leaf({
                        keys: [1],
                        children: [1],
                    }),
                    new Leaf({
                        keys: [2],
                        children: [2],
                    }),
                ],
            });

            tree = new BTMap({ root: rootNode, height: 1, size: 2 });

            const collapsed = tree.delete(1);

            expect(collapsed.root).to.be.an.instanceOf(Leaf);
            expect(collapsed.root.keys).to.deep.equal([2]);
            expect(collapsed.root.children).to.deep.equal([2]);
        });

        it('delete without modification', () => {
            const sameTree = tree.delete(999);
            expect(sameTree).to.equal(tree);
        });

        it('iterable protocol', () => {
            expect(tree[Symbol.iterator]).to.be.a('function');
            const iter = tree[Symbol.iterator]();
            expect(iter[Symbol.iterator]).to.be.a('function');
            expect(iter.next).to.be.a('function');

            expect(Array.from(iter)).to.deep.equal([[1, 1], [2, 2], [3, 3]]);
            expect(Array.from(tree)).to.deep.equal([[1, 1], [2, 2], [3, 3]]);
        });

        it('keys', () => {
            const iterator = tree.keys();
            expect(iterator.next).to.be.a('function');
            expect(iterator[Symbol.iterator]).to.be.a('function');

            expect(Array.from(iterator)).to.deep.equal([1, 2, 3]);
        });

        it('keys on empty tree', () => {
            const emptyTree = tree.clear();
            const iterator = emptyTree.keys();
            expect(Array.from(iterator)).to.deep.equal([]);
        });

        it('values', () => {
            const iterator = tree.values();
            expect(iterator.next).to.be.a('function');
            expect(iterator[Symbol.iterator]).to.be.a('function');

            expect(Array.from(iterator)).to.deep.equal([1, 2, 3]);
        });

        it('entries', () => {
            const iterator = tree.entries();
            expect(iterator.next).to.be.a('function');
            expect(iterator[Symbol.iterator]).to.be.a('function');
            expect(Array.from(iterator)).to.deep.equal([[1, 1], [2, 2], [3, 3]]);
        });

        describe('methods related to paths', () => {
            beforeEach(() => {
                const rootNode = new InternalNode({
                    keys: [2],
                    children: [
                        new Leaf({
                            keys: [1],
                            children: [1],
                        }),
                        new Leaf({
                            keys: [2, 3],
                            children: [2, 3],
                        }),
                    ],
                });

                tree = new BTMap({ root: rootNode, height: 1, size: 2 });
            });

            it('_pathNodes', () => {
                const nodes = tree._pathNodes(Path.from([0, 0]));
                expect(nodes).to.have.lengthOf(2);
                expect(nodes[0]).to.equal(tree.root);
                expect(nodes[1]).to.equal(tree.root.children[0]);

                const nodes2 = tree._pathNodes(Path.from([0, 1]));
                expect(nodes2).to.have.lengthOf(2);
                expect(nodes2[0]).to.equal(tree.root);
                expect(nodes2[1]).to.equal(tree.root.children[0]);

                const nodes3 = tree._pathNodes(Path.from([1, 0]));
                expect(nodes3).to.have.lengthOf(2);
                expect(nodes3[0]).to.equal(tree.root);
                expect(nodes3[1]).to.equal(tree.root.children[1]);
            });

            it('_getLeftmostPath, null case', () => {
                const empty = tree.clear();
                expect(empty._getLeftmostPath()).to.be.null;
            });

            it('_getLeftmostPath', () => {
                const path = tree._getLeftmostPath();
                expect(path.toArray()).to.deep.equal([0, 0]);
            });

            it('_getRightmostPath', () => {
                const path = tree._getRightmostPath();
                expect(path.toArray()).to.deep.equal([1, 1]);
            });

            it('_getRightmostPath, null case', () => {
                const path = tree.clear()._getRightmostPath();
                expect(path).to.be.null;
            });

            it('_getLeafFromPath', () => {
                const path = Path.from([0, 0]);
                const leaf = tree._getLeafFromPath(path);
                expect(leaf).to.equal(tree.root.children[0]);

                const path2 = Path.from([1, 0]);
                const leaf2 = tree._getLeafFromPath(path2);
                expect(leaf2).to.equal(tree.root.children[1]);
            });

            it('between', () => {
                const findPathSpy = sinon.spy(tree, 'findPath');
                const getIteratorSpy = sinon.spy(tree, '_iteratorFromTo');

                const result = tree.between(2, 3);
                expect(result).to.equal(getIteratorSpy.firstCall.returnValue);

                const findFromPathCall = findPathSpy.getCall(0);
                const findToPathCall = findPathSpy.getCall(1);

                const [fromLeft, fromRight] = [false, true];
                expect(findPathSpy).to.have.been.calledWith(2, fromLeft);
                expect(findPathSpy).to.have.been.calledWith(3, fromRight);

                const iteratorCall = getIteratorSpy.getCall(0);
                const [_, fromPath, toPath, isReverse] = iteratorCall.args;
                expect(fromPath).to.equal(findFromPathCall.returnValue);
                expect(toPath).to.equal(findToPathCall.returnValue);
                expect(isReverse).to.be.false;
            });

            it('between same value', () => {
                const findPathSpy = sinon.spy(tree, 'findPath');
                const getIteratorSpy = sinon.spy(tree, '_iteratorFromTo');

                const result = tree.between(2, 2);
                expect(result).to.equal(getIteratorSpy.firstCall.returnValue);

                const findFromPathCall = findPathSpy.getCall(0);
                const findToPathCall = findPathSpy.getCall(1);

                const [fromLeft, fromRight] = [false, true];
                expect(findPathSpy).to.have.been.calledWith(2, fromLeft);
                expect(findPathSpy).to.have.been.calledWith(2, fromRight);

                const iteratorCall = getIteratorSpy.getCall(0);
                const [_, fromPath, toPath, isReverse] = iteratorCall.args;
                expect(fromPath).to.equal(findFromPathCall.returnValue);
                expect(toPath).to.equal(findToPathCall.returnValue);
                expect(isReverse).to.be.false;
            });

            it('between nonexisting value', () => {
                const result = tree.between(999, 1000);
                assertEmptyIterator(result);
            });

            it('between reverse', () => {
                const findPathSpy = sinon.spy(tree, 'findPath');
                const getIteratorSpy = sinon.spy(tree, '_iteratorFromTo');

                const result = tree.between(3, 2);
                expect(result).to.equal(getIteratorSpy.firstCall.returnValue);

                const findFromPathCall = findPathSpy.firstCall;
                const findToPathCall = findPathSpy.secondCall;

                const [fromLeft, fromRight] = [false, true];
                expect(findPathSpy).to.have.been.calledWith(3, fromRight);
                expect(findPathSpy).to.have.been.calledWith(2, fromLeft);

                const iteratorCall = getIteratorSpy.getCall(0);
                const [_, fromPath, toPath, isReverse] = iteratorCall.args;

                expect(fromPath).to.equal(findFromPathCall.returnValue);
                expect(toPath).to.equal(findToPathCall.returnValue);
                expect(isReverse).to.be.true;
            });

            it('findPath', () => {
                const isLeft = undefined;
                const isRight = true;

                const path = tree.findPath(1, isLeft);
                expect(path.toArray()).to.deep.equal([0, 0]);

                const nonexistingPath = tree.findPath(0, isLeft);
                // Should return the leftmost path in this case.
                expect(nonexistingPath.toArray()).to.deep.equal([0, 0]);

                expect(tree.findPath(0, isRight)).to.be.null;

                const betweenKeys = tree.findPath(1.5, isLeft);
                expect(betweenKeys.toArray()).to.deep.equal([1, 0]);

                const betweenKeys2 = tree.findPath(1.5, isRight);
                expect(betweenKeys2.toArray()).to.deep.equal([0, 0]);

                const nonexistingPath2 = tree.findPath(4, isRight);
                expect(nonexistingPath2.toArray()).to.deep.equal([1, 1]);

                expect(tree.findPath(4, isLeft)).to.be.null;
            });

            it('_nextPath', () => {
                const leftPath = tree._getLeftmostPath();

                const pathSequence = [];
                let currPath = leftPath;
                while (currPath !== null) {
                    pathSequence.push(currPath);
                    currPath = tree._nextPath(currPath);
                }
                expect(pathSequence.map(path => path.toArray()))
                    .to.deep.equal([
                        [0, 0],
                        [1, 0],
                        [1, 1],
                    ]);
            });

            it('_prevPath', () => {
                const rightPath = tree._getRightmostPath();

                const pathSequence = [];
                let currPath = rightPath;
                while (currPath !== null) {
                    pathSequence.push(currPath);
                    currPath = tree._prevPath(currPath);
                }
                expect(pathSequence.map(path => path.toArray()))
                    .to.deep.equal([
                        [1, 1],
                        [1, 0],
                        [0, 0],
                    ]);
            });
        });
    });
});

describe('BTSet', () => {
    it('constructor', () => {
        const set = new BTSet();
        expect(set.isSet).to.be.true;
    });

    it('iterator', () => {
        const set = BTSet.from([1, 2, 3]);
        const result = Array.from(set);
        expect(result).to.deep.equal([1, 2, 3]);
    });
});

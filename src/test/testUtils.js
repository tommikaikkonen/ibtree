import chai from 'chai';
import sinonChai from 'sinon-chai';
import flatten from 'ramda/src/flatten';
import {
    slice,
    withoutIdx,
    splitAt,
    insert,
    set,
    fastMap,
    unshift,
    takeIdxAndSplit,
    boundedChunk,
    tagOwnerID,
    makeOwnerID,
} from '../utils';

chai.use(sinonChai);
const { expect } = chai;

function assertArrayShallowEquals(a, b) {
    expect(a).to.have.lengthOf(b.length);
    for (let i = 0; i < a.length; i++) {
        expect(a[i]).to.equal(b[i]);
    }
}

describe('Utils', () => {
    it('bounded chunk', () => {
        const size = 102;
        const data = new Array(size);
        const min = 5;
        const max = 10;
        const chunks = boundedChunk(min, max, data);
        chunks.forEach(chunk => {
            expect(chunk.length).to.be.at.least(min);
            expect(chunk.length).to.be.at.most(max);
        });
        expect(flatten(chunks).length).to.equal(size);
    });

    it('slice', () => {
        const arr = [0, 1, 2, 3, 4];
        const result = slice(null, 1, 3, arr);
        assertArrayShallowEquals(result, [1, 2]);
    });

    it('slice with mutations', () => {
        const ownerID = makeOwnerID();
        const arr = tagOwnerID([0, 1, 2, 3, 4], ownerID);
        const result = slice(ownerID, 1, 3, arr);
        expect(result).to.equal(arr);

        assertArrayShallowEquals(result, [1, 2]);
    });

    it('fastMap', () => {
        const arr = [0, 1, 2, 3];
        const result = fastMap(num => num.toString(), arr);
        expect(result).to.deep.equal(['0', '1', '2', '3']);
    });

    it('insert', () => {
        const arr = [0, 1, 3, 4];
        const result = insert(null, 2, 2, arr);
        expect(result).to.deep.equal([0, 1, 2, 3, 4]);
    });

    it('insert with mutations', () => {
        const id = {};
        const arr = [0, 1, 3, 4];
        tagOwnerID(arr, id);
        const result = insert(id, 2, 2, arr);
        expect(result).to.equal(arr);
        assertArrayShallowEquals(result, [0, 1, 2, 3, 4]);
    });

    it('withoutIdx', () => {
        const arr = [0, 1, 1, 2, 3];
        const result = withoutIdx(null, 2, arr);
        assertArrayShallowEquals(result, [0, 1, 2, 3]);
    });

    it('withoutIdx with mutations', () => {
        const ownerID = makeOwnerID();
        const arr = tagOwnerID([0, 1, 1, 2, 3], ownerID);
        const result = withoutIdx(ownerID, 2, arr);
        expect(result).to.equal(arr);
        assertArrayShallowEquals(result, [0, 1, 2, 3]);
    });

    it('splitAt', () => {
        const arr = [0, 1, 2, 3];
        const result = splitAt(null, 2, arr);

        const left = result[0];
        const right = result[1];

        assertArrayShallowEquals(left, [0, 1]);
        assertArrayShallowEquals(right, [2, 3]);
    });

    it('unshift', () => {
        const arr = [1, 2, 3];
        const result = unshift(null, 0, arr);
        expect(result).to.deep.equal([0, 1, 2, 3]);
    });

    it('unshift with mutations', () => {
        const ownerID = {};
        const arr = tagOwnerID([1, 2, 3], ownerID);
        const result = unshift(ownerID, 0, arr);
        expect(result).to.equal(arr);
        assertArrayShallowEquals(result, [0, 1, 2, 3]);
    });

    it('takeIdxAndSplit', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = takeIdxAndSplit(null, 2, arr);

        const leftResult = result[0];
        const takenIdx = result[1];
        const rightResult = result[2];

        assertArrayShallowEquals(leftResult, [1, 2]);
        expect(takenIdx).to.equal(3);
        assertArrayShallowEquals(rightResult, [4, 5]);
    });

    it('set', () => {
        const arr = [1, 999, 3];
        const result = set(null, 1, 2, arr);
        expect(result).not.to.equal(arr);
        assertArrayShallowEquals(result, [1, 2, 3]);
    });

    it('set with mutations', () => {
        const ownerID = makeOwnerID();
        const arr = tagOwnerID([1, 999, 3], ownerID);
        const result = set(ownerID, 1, 2, arr);
        expect(result).to.equal(arr);
        assertArrayShallowEquals(result, [1, 2, 3]);
    });
});

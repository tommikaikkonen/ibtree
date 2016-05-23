import chai from 'chai';
import sinonChai from 'sinon-chai';
import flatten from 'ramda/src/flatten';
import {
    fastArraySlice,
    withoutIdx,
    splitAt,
    fastInsert,
    fastMap,
    unshift,
    takeIdxAndSplit,
    boundedChunk,
} from '../utils';

chai.use(sinonChai);
const { expect } = chai;

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

    it('fastArraySlice', () => {
        const arr = [0, 1, 2, 3, 4];
        const result = fastArraySlice(1, 3, arr);
        expect(result).to.deep.equal([1, 2]);
    });

    it('fastMap', () => {
        const arr = [0, 1, 2, 3];
        const result = fastMap(num => num.toString(), arr);
        expect(result).to.deep.equal(['0', '1', '2', '3']);
    });

    it('fastInsert', () => {
        const arr = [0, 1, 3, 4];
        const result = fastInsert(2, 2, arr);
        expect(result).to.deep.equal([0, 1, 2, 3, 4]);
    });

    it('withoutIdx', () => {
        const arr = [0, 1, 1, 2, 3];
        const result = withoutIdx(2, arr);
        expect(result).to.deep.equal([0, 1, 2, 3]);
    });

    it('splitAt', () => {
        const arr = [0, 1, 2, 3];
        const result = splitAt(2, arr);
        expect(result).to.deep.equal([[0, 1], [2, 3]]);
    });

    it('unshift', () => {
        const arr = [1, 2, 3];
        const result = unshift(0, arr);
        expect(result).to.deep.equal([0, 1, 2, 3]);
    });

    it('takeIdxAndSplit', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = takeIdxAndSplit(2, arr);
        expect(result).to.deep.equal([[1, 2], 3, [4, 5]]);
    });
});

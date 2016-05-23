import chai from 'chai';
import sinonChai from 'sinon-chai';
import binarySearch from '../binarysearch';
import {
    defaultComparator,
} from '../index';

chai.use(sinonChai);
const { expect } = chai;

describe('Binary Search', () => {
    let arr;
    before(() => {
        arr = [10, 13, 15, 17];
    });
    it('eq', () => {
        const idx = binarySearch.eq(arr, 13, defaultComparator);
        expect(idx).to.equal(1);

        const notfound = binarySearch.eq(arr, 9, defaultComparator);
        expect(notfound).to.equal(-1);
    });

    it('lte', () => {
        const idx = binarySearch.lte(arr, 13, defaultComparator);
        expect(idx).to.equal(1);

        const idxtwo = binarySearch.lte(arr, 12, defaultComparator);
        expect(idxtwo).to.equal(0);

        expect(binarySearch.lte(arr, 10, defaultComparator)).to.equal(0);

        const idxthree = binarySearch.lte(arr, 9, defaultComparator);
        expect(idxthree).to.equal(-1);

        const idxfour = binarySearch.lte(arr, 18, defaultComparator);
        expect(idxfour).to.equal(3);
    });

    it('gte', () => {
        const idx = binarySearch.gte(arr, 13, defaultComparator);
        expect(idx).to.equal(1);
        const idxtwo = binarySearch.gte(arr, 12, defaultComparator);
        expect(idxtwo).to.equal(1);

        const idxthree = binarySearch.gte(arr, 9, defaultComparator);
        expect(idxthree).to.equal(0);

        const idxfour = binarySearch.gte(arr, 18, defaultComparator);
        expect(idxfour).to.equal(4); // Note: this returns array length.
    });
});

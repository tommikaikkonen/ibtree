import chai from 'chai';
import sinonChai from 'sinon-chai';
import {
    Path,
    bitSlice,
    clearBitRange,
    pathSet,
    safePathSet,
    pathGet,
} from '../path';

chai.use(sinonChai);
const { expect } = chai;

describe('Path', () => {
    let path;
    let pathWithValues;
    beforeEach(() => {
        path = new Path();

        const pathValue = parseInt(('000000' + '000111' + '000000'), 2);
        pathWithValues = new Path(6, 5, pathValue);
    });
    it('constructor works', () => {
        expect(path.shiftLen).to.equal(6);
        expect(path._path).to.equal(0);
    });

    it('from works', () => {
        const pathArr = [1, 2, 3, 4];
        const _path = Path.from(pathArr);
        expect(_path.get(0)).to.equal(1);
        expect(_path.get(1)).to.equal(2);
        expect(_path.get(2)).to.equal(3);
        expect(_path.get(3)).to.equal(4);
        expect(_path.length).to.equal(pathArr.length);
    });

    it('toArray works', () => {
        const pathArr = [1, 2, 3, 4];
        const _path = Path.from(pathArr);
        expect(_path.toArray()).to.deep.equal([1, 2, 3, 4]);
    });

    it('setting a value works', () => {
        const newPath = path.set(0, 5);
        expect(newPath._path).to.not.equal(path._path);
        expect(newPath.get(0)).to.equal(5);

        const overwrittenPath = pathWithValues.set(1, 50);
        expect(overwrittenPath.get(1)).to.equal(50);
    });

    it('gets a value', () => {
        expect(path.get(0)).to.equal(0);
        expect(pathWithValues.get(1)).to.equal(7);
    });
});

describe('Bit operations', () => {
    it('bitSlice', () => {
        const num = parseInt('0011111100', 2);
        const expected = parseInt('111111', 2);
        expect(bitSlice(2, 8, num)).to.equal(expected);
    });

    it('pathGet', () => {
        const lvlShift = 6;
        const firstBin = '010101';
        const first = parseInt(firstBin, 2);

        const secondBin = '010100';
        const second = parseInt(secondBin, 2);

        const thirdBin = '010111';
        const third = parseInt(thirdBin, 2);

        const num = parseInt(thirdBin + secondBin + firstBin, 2);

        expect(pathGet(lvlShift, 0, num)).to.equal(first);
        expect(pathGet(lvlShift, 1, num)).to.equal(second);
        expect(pathGet(lvlShift, 2, num)).to.equal(third);
    });

    it('clearBitRange', () => {
        const bin = '1111';
        const cleared = clearBitRange(1, 3, parseInt(bin, 2));
        expect(cleared).to.equal(parseInt('1001', 2));
    });

    it('pathSet', () => {
        const lvlShift = 6;
        const numBin = '000000' + '010101' + '000000';
        const num = parseInt(numBin, 2);

        const result = pathSet(lvlShift, 0, num, parseInt('111111', 2));

        expect(result).to.equal(parseInt('000000' + '010101' + '111111', 2));

        const result2 = pathSet(lvlShift, 2, num, parseInt('111111', 2));

        expect(result2).to.equal(parseInt('111111' + '010101' + '000000', 2));
    });

    it('safePathSet', () => {
        const lvlShift = 6;
        const numBin = '000000' + '010101' + '111111';
        const num = parseInt(numBin, 2);

        const result = safePathSet(lvlShift, 1, num, parseInt('111000', 2));
        expect(result).to.equal(parseInt('000000' + '111000' + '111111', 2));
    });
});

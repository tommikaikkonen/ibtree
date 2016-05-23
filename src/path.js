import {
    SHIFT_LEN,
} from './constants';
import {
    extend,
} from './utils';

const MIN_PATH = 0;
const NUMBER_OF_UNSIGNED_BITS = 31;

export const LEVELS = Math.floor(NUMBER_OF_UNSIGNED_BITS / SHIFT_LEN);

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
export const bitSlice = (fromBit, toBit, num) => {
    // toBit exclusive. Mask is from bits 0..toBit - 1.
    const mask = Math.pow(2, toBit) - 1;

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
export const pathGet = (shiftLen, level, path) =>
    bitSlice(
        shiftLen * level,
        shiftLen * (level + 1),
        path
    );

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
export const pathSet = (shiftLen, level, path, newValue) =>
    path | (newValue << (shiftLen * level));

export const clearBitRange = (fromBit, toBit, num) => {
    const rangeLen = toBit - fromBit;
    const mask = Math.pow(2, rangeLen) - 1;
    return num & ~(mask << fromBit);
};

// Safe version of `pathSet` where the current value is cleared before
// assigning a new value.
export const safePathSet = (shiftLen, level, path, newValue) => {
    const cleared = clearBitRange(
        shiftLen * level,
        shiftLen * (level + 1),
        path
    );
    return pathSet(shiftLen, level, cleared, newValue);
};

function Path(shiftLen, levels, path) {
    this.shiftLen = shiftLen || SHIFT_LEN;
    this.length = levels || LEVELS;
    this._path = path || 0;
}

Path.EMPTY_PATH = new Path(SHIFT_LEN, LEVELS, MIN_PATH);
Path.from = function from(arr) {
    const levels = arr.length;

    let path = 0;
    for (let i = 0; i < levels; i++) {
        path = pathSet(SHIFT_LEN, i, path, arr[i]);
    }

    return new Path(SHIFT_LEN, levels, path);
};

extend(Path.prototype, {
    get(level) {
        return pathGet(this.shiftLen, level, this._path);
    },

    equals(otherPath) {
        return this._path === otherPath._path;
    },

    clearAfter(level) {
        let currLevel = level + 1;
        let newPath = this;
        while (currLevel < this.length) {
            newPath = newPath.set(currLevel, 0);
            currLevel++;
        }
        return newPath;
    },

    toArray() {
        const arr = new Array(this.length);
        for (let i = 0; i < this.length; i++) {
            arr[i] = this.get(i);
        }
        return arr;
    },

    compareTo(otherPath) {
        const a = this._path;
        const b = otherPath._path;
        return a === b ? 0 : a < b ? - 1 : 1; // eslint-disable-line no-nested-ternary
    },

    increment(level) {
        const newPath = this.set(level, this.get(level) + 1);
        return newPath.clearAfter(level);
    },

    decrement(level) {
        return this.set(level, this.get(level) - 1);
    },

    set(level, value) {
        const newPath = safePathSet(this.shiftLen, level, this._path, value);
        return new Path(this.shiftLen, this.length, newPath);
    },
});

export { Path };
export default Path;

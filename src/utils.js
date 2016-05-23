import {
    ITERATOR_PROPNAME,
} from './constants';

export const median = len => Math.ceil(len / 2);

export function fastArraySlice(start, end, arr) {
    const newArr = new Array(end - start);
    for (let i = start; i < end; i++) {
        newArr[i - start] = arr[i];
    }
    return newArr;
}

export function fastArrayClone(arr) {
    const len = arr.length;
    const copy = new Array(len);

    for (let i = 0; i < len; i++) {
        copy[i] = arr[i];
    }
    return copy;
}

export function withoutIdx(idx, arr) {
    const copied = fastArrayClone(arr);
    copied.splice(idx, 1);
    return copied;
}

export function fastInsert(idx, val, arr) {
    const newArrLen = arr.length + 1;
    const newArr = new Array(newArrLen);

    let i = 0;
    for (; i < idx; i++) {
        newArr[i] = arr[i];
    }

    newArr[i++] = val;

    for (; i < newArrLen; i++) {
        newArr[i] = arr[i - 1];
    }

    return newArr;
}

export function fastSet(idx, val, arr) {
    const copied = fastArrayClone(arr);
    copied[idx] = val;
    return copied;
}

export function fastMap(fn, arr) {
    const copied = fastArrayClone(arr);
    const len = arr.length;
    for (let i = 0; i < len; i++) {
        copied[i] = fn(arr[i], i);
    }
    return copied;
}

export function splitAt(idx, arr) {
    const arrLen = arr.length;
    const firstArrLen = idx;
    const firstArr = new Array(firstArrLen);
    const secondArrLen = arrLen - idx;
    const secondArr = new Array(secondArrLen);

    for (let i = 0; i < idx; i++) {
        firstArr[i] = arr[i];
    }

    for (let i = idx; i < arrLen; i++) {
        secondArr[i - idx] = arr[i];
    }

    return [firstArr, secondArr];
}

export function unshift(value, arr) {
    return fastInsert(0, value, arr);
}

export const takeIdxAndSplit = (idx, arr) => {
    const cutoff = idx;
    const a1len = cutoff;
    const arr1 = fastArraySlice(0, a1len, arr);
    const arr2 = fastArraySlice(cutoff + 1, arr.length, arr);
    return [arr1, arr[cutoff], arr2];
};

export function last(arr) {
    return arr[arr.length - 1];
}

export function init(arr) {
    if (arr.length <= 1) return [];
    return fastArraySlice(0, arr.length - 1, arr);
}

export function tail(arr) {
    if (arr.length <= 1) return [];
    return fastArraySlice(1, arr.length, arr);
}

export function getEmptyIterator() {
    const iterator = {
        next: () => ({ done: true }),
    };

    iterator[ITERATOR_PROPNAME] = () => iterator;

    return iterator;
}

export const boundedChunk = (min, max, arr) => {
    const arrLen = arr.length;
    if (!arr.length) return [];
    if (arr.length <= max) {
        return [arr];
    }

    const avg = Math.ceil((min + max) / 2);
    const parts = arrLen / avg;
    const chunkCount = Math.ceil(parts);
    const splitsize = (1 / chunkCount) * arrLen;
    const chunks = new Array(chunkCount);
    for (let i = 0; i < chunkCount; i++) {
        chunks[i] = arr.slice(Math.ceil(i * splitsize), Math.ceil((i + 1) * splitsize));
    }
    return chunks;
};

export function extend(target) {
    const argsLen = arguments.length;
    let source;
    let keys;
    let key;
    let i;
    let j;

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

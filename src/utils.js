import {
    ITERATOR_PROPNAME,
} from './constants';

export const median = len => Math.ceil(len / 2);

export function makeOwnerID() {
    return {};
}

export function tagOwnerID(obj, ownerID) {
    obj.ownerID = ownerID;
    return obj;
}

export function canMutate(obj, ownerID) {
    return ownerID && ownerID === obj.ownerID;
}

function allocateArray(ownerID, len) {
    return tagOwnerID(len ? new Array(len) : [], ownerID);
}

export function slice(ownerID, start, end, arr) {
    const newLen = end - start;
    if (canMutate(arr, ownerID)) {
        let removeNFromStart = start;
        let removeNFromEnd = arr.length - end;
        while (removeNFromStart--) {
            arr.shift();
        }
        while (removeNFromEnd--) {
            arr.pop();
        }

        return arr;
    }

    const newArr = allocateArray(ownerID, newLen);
    for (let i = start; i < end; i++) {
        newArr[i - start] = arr[i];
    }
    return newArr;
}

export function arrayClone(arr) {
    const len = arr.length;
    const copy = new Array(len);

    for (let i = 0; i < len; i++) {
        copy[i] = arr[i];
    }
    return copy;
}

export function withoutIdx(ownerID, idx, arr) {
    const copied = canMutate(arr, ownerID)
        ? arr
        : tagOwnerID(arrayClone(arr), ownerID);

    copied.splice(idx, 1);
    return copied;
}

export function insert(ownerID, idx, val, arr) {
    if (canMutate(arr, ownerID)) {
        arr.splice(idx, 0, val);
        return arr;
    }

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

export function set(ownerID, idx, val, arr) {
    const copied = canMutate(arr, ownerID)
        ? arr
        : tagOwnerID(arrayClone(arr), ownerID);

    copied[idx] = val;
    return copied;
}

export function fastMap(fn, arr) {
    const copied = arrayClone(arr);
    const len = arr.length;
    for (let i = 0; i < len; i++) {
        copied[i] = fn(arr[i], i);
    }
    return copied;
}

export function splitAt(ownerID, idx, arr) {
    const arrLen = arr.length;
    const firstArrLen = idx;
    const secondArrLen = arrLen - idx;
    const secondArr = allocateArray(ownerID, secondArrLen);

    const firstArr = allocateArray(ownerID, firstArrLen);

    for (let i = 0; i < idx; i++) {
        firstArr[i] = arr[i];
    }

    for (let i = idx; i < arrLen; i++) {
        secondArr[i - idx] = arr[i];
    }

    return [firstArr, secondArr];
}

export function unshift(ownerID, value, arr) {
    return insert(ownerID, 0, value, arr);
}

export const takeIdxAndSplit = (ownerID, idx, arr) => {
    const cutoff = idx;
    const a1len = cutoff;
    const arr1 = slice(ownerID, 0, a1len, arr);
    const arr2 = slice(ownerID, cutoff + 1, arr.length, arr);
    return [arr1, arr[cutoff], arr2];
};

export function last(arr) {
    return arr[arr.length - 1];
}

export function init(ownerID, arr) {
    if (canMutate(arr, ownerID)) {
        if (arr.length === 0) return arr;
        arr.pop();
        return arr;
    }

    if (arr.length <= 1) return allocateArray(ownerID);
    return slice(ownerID, 0, arr.length - 1, arr);
}

export function tail(ownerID, arr) {
    if (canMutate(arr, ownerID)) {
        arr.shift();
        return arr;
    }

    if (arr.length <= 1) return tagOwnerID([], ownerID);
    return slice(ownerID, 1, arr.length, arr);
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

export function makeRef(value) {
    return { value };
}

export function setRef(ref) {
    ref.value = true;
}

export function isSet(ref) {
    return !!ref.value;
}

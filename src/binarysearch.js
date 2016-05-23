// predicate should return true if we should go right.
export function lte(array, value, cmp) {
    const len = array.length;
    if (len === 0 || !(cmp(array[0], value) <= 0)) {
        return - 1;
    }

    let l = 0;
    let r = len;
    while (r - l > 1) {
        // In our case, r + l <= 128 so we don't need
        // to worry about overflow here
        const mid = (r + l) >>> 1;
        if (cmp(array[mid], value) <= 0) {
            // value at `mid` is less than or equal to `value`, go right.
            l = mid;
        } else {
            // if value at `mid` is larger than `value`, go left.
            r = mid;
        }
    }

    return l;
}

// predicate should return true if we should go left
export function gte(array, value, cmp) {
    const len = array.length;
    if (len === 0 || !(cmp(array[len - 1], value) >= 0)) return len;
    let l = -1;
    let r = len - 1;
    while (r - l > 1) {
        const mid = (r + l) >>> 1;
        if (cmp(array[mid], value) >= 0) {
            // value at `mid` is less than or equal to `value`, go right.
            r = mid;
        } else {
            // if value at `mid` is larger than `value`, go left.
            l = mid;
        }
    }

    return r;
}

export function eq(array, value, cmp) {
    const idx = lte(array, value, cmp);
    if (idx !== -1 && cmp(array[idx], value) === 0) {
        return idx;
    }
    return - 1;
}

export default {
    lte,
    gte,
    eq,
};

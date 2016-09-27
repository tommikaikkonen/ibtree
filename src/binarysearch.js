function baseLte(inclusive, array, value, cmp) {
    const len = array.length;
    if (len === 0 || !(inclusive ? cmp(array[0], value) <= 0 : cmp(array[0], value) < 0)) {
        return - 1;
    }

    let l = 0;
    let r = len;
    while (r - l > 1) {
        // In our case, r + l <= 128 so we don't need
        // to worry about overflow here
        const mid = (r + l) >>> 1;
        const item = array[mid];
        if (inclusive ? cmp(item, value) <= 0 : cmp(item, value) < 0) {
            l = mid;
        } else {
            r = mid;
        }
    }

    return l;
}

export const lte = baseLte.bind(null, true);
export const lt = baseLte.bind(null, false);

export function baseGte(inclusive, array, value, cmp) {
    const len = array.length;
    if (len === 0 || !(inclusive
            ? cmp(array[len - 1], value) >= 0
            : cmp(array[len - 1], value) > 0)) return len;
    let l = -1;
    let r = len - 1;
    while (r - l > 1) {
        const mid = (r + l) >>> 1;
        const item = array[mid];
        if (inclusive ? cmp(item, value) >= 0 : cmp(item, value) > 0) {
            r = mid;
        } else {
            l = mid;
        }
    }

    return r;
}

export const gte = baseGte.bind(null, true);
export const gt = baseGte.bind(null, false);

export function eq(array, value, cmp) {
    const idx = lte(array, value, cmp);
    if (idx !== -1 && cmp(array[idx], value) === 0) {
        return idx;
    }
    return - 1;
}

export default {
    lt,
    gt,
    lte,
    gte,
    eq,
};

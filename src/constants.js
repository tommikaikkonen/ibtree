export const MIN_ROOT_CHILDREN = 2;

// These numbers are optimized for the Path implementation.
// With these values we can store paths in the binary representation
// of an integer - the lowest 30 bits divide to 5 parts of 6 bits each.
// During range searches and iteration, we check if we've reached the
// end path at each element. When the path is represented as an integer,
// we can do a fast integer comparison.
//
// 6 bits gives us a range of 2^6 = 64 values for each part.
// The maximum tree size with these limitations should be more than enough,
// 64^5 - 1 = 1,073,741,823, that's about 1 billion elements.
export const ORDER = 64;
export const SHIFT_LEN = 6;

export const LEAF_MIN_CHILDREN = Math.ceil(ORDER / 2) - 1;
export const LEAF_MAX_CHILDREN = ORDER - 1;
export const INTERNAL_MIN_CHILDREN = Math.ceil(ORDER / 2);
export const INTERNAL_MAX_CHILDREN = ORDER;

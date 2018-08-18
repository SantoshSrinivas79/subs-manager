const _helpers = {
    // Get the last element of an array. Passing **n** will return the last N
    // values in the array.
    last(array, n, guard) {
        if (array == null || array.length < 1) return n == null ? void 0 : [];
        if (n == null || guard) return array[array.length - 1];
        return Array.prototype.slice(array, n == null || guard ? 1 : n);
    },
    // Run the supplied function only once and return the same result on subsequent calls.
    runOnce(fn, context) {
        let result;
        return function () {
            if (fn) {
                result = fn.apply(context || this, arguments);
                fn = null;
            }
            return result;
        };
    }
};


export default _helpers;

export const memoizeWeakMap = <V extends object, R>(fn: (v: V) => R) => {
    const weakMap = new WeakMap<V, R>();
    return (v: V): R => {
        if (weakMap.has(v)) return weakMap.get(v)!;
        const r = fn(v);
        weakMap.set(v, r);
        return r;
    };
};

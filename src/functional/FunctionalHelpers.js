/**
 * 🔧 FUNCTIONAL PROGRAMMING HELPERS
 * Elimina duplicação através de composição e higher-order functions
 *
 * @module FunctionalHelpers
 * @author Sistema de Qualidade Avançada
 * @version 3.0.0
 */

/**
 * Compose - combina funções da direita para esquerda
 */
export const compose =
    (...fns) =>
    (value) =>
        fns.reduceRight((acc, fn) => fn(acc), value);

/**
 * Pipe - combina funções da esquerda para direita
 */
export const pipe =
    (...fns) =>
    (value) =>
        fns.reduce((acc, fn) => fn(acc), value);

/**
 * Curry - transforma função multi-parâmetro em sequência de funções
 */
export const curry = (fn) => {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn.apply(this, args);
        } else {
            return function (...args2) {
                return curried.apply(this, args.concat(args2));
            };
        }
    };
};

/**
 * Partial Application - aplica parcialmente argumentos
 */
export const partial =
    (fn, ...args1) =>
    (...args2) =>
        fn(...args1, ...args2);

/**
 * Maybe Monad para operações seguras
 */
export class Maybe {
    constructor(value) {
        this.value = value;
    }

    static of(value) {
        return new Maybe(value);
    }

    static nothing() {
        return new Maybe(null);
    }

    isNothing() {
        return this.value === null || this.value === undefined;
    }

    map(fn) {
        return this.isNothing() ? Maybe.nothing() : Maybe.of(fn(this.value));
    }

    flatMap(fn) {
        return this.isNothing() ? Maybe.nothing() : fn(this.value);
    }

    filter(predicate) {
        return this.isNothing() || !predicate(this.value) ? Maybe.nothing() : this;
    }

    getOrElse(defaultValue) {
        return this.isNothing() ? defaultValue : this.value;
    }

    tap(fn) {
        if (!this.isNothing()) {
            fn(this.value);
        }
        return this;
    }
}

/**
 * Either Monad para tratamento de erros funcionais
 */
export class Either {
    constructor(value, isRight = true) {
        this.value = value;
        this.isRight = isRight;
    }

    static right(value) {
        return new Either(value, true);
    }

    static left(value) {
        return new Either(value, false);
    }

    map(fn) {
        return this.isRight ? Either.right(fn(this.value)) : this;
    }

    flatMap(fn) {
        return this.isRight ? fn(this.value) : this;
    }

    mapLeft(fn) {
        return this.isRight ? this : Either.left(fn(this.value));
    }

    fold(leftFn, rightFn) {
        return this.isRight ? rightFn(this.value) : leftFn(this.value);
    }

    getOrElse(defaultValue) {
        return this.isRight ? this.value : defaultValue;
    }

    isLeft() {
        return !this.isRight;
    }
}

/**
 * Task Monad para operações assíncronas
 */
export class Task {
    constructor(computation) {
        this.computation = computation;
    }

    static of(value) {
        return new Task((resolve) => resolve(value));
    }

    static rejected(error) {
        return new Task((resolve, reject) => reject(error));
    }

    map(fn) {
        return new Task((resolve, reject) => {
            this.computation((value) => resolve(fn(value)), reject);
        });
    }

    flatMap(fn) {
        return new Task((resolve, reject) => {
            this.computation((value) => fn(value).computation(resolve, reject), reject);
        });
    }

    run() {
        return new Promise((resolve, reject) => {
            this.computation(resolve, reject);
        });
    }

    static parallel(tasks) {
        return new Task((resolve, reject) => {
            Promise.all(tasks.map((task) => task.run()))
                .then(resolve)
                .catch(reject);
        });
    }

    static sequence(tasks) {
        return tasks.reduce(
            (acc, task) => acc.flatMap((results) => task.map((result) => [...results, result])),
            Task.of([])
        );
    }
}

/**
 * Higher-Order Functions para operações comuns
 */

/**
 * Retry com backoff exponencial
 */
export const retry = curry((maxAttempts, backoffMs, fn) => {
    const attempt = (attemptNumber) => {
        return Task.of(null)
            .flatMap(
                () =>
                    new Task((resolve, reject) => {
                        try {
                            const result = fn();
                            if (result && typeof result.then === 'function') {
                                result.then(resolve).catch(reject);
                            } else {
                                resolve(result);
                            }
                        } catch (error) {
                            reject(error);
                        }
                    })
            )
            .run()
            .catch((error) => {
                if (attemptNumber >= maxAttempts) {
                    throw error;
                }

                const delay = backoffMs * Math.pow(2, attemptNumber - 1);
                return new Promise((resolve) =>
                    setTimeout(() => resolve(attempt(attemptNumber + 1)), delay)
                );
            });
    };

    return () => attempt(1);
});

/**
 * Timeout wrapper
 */
export const timeout = curry((ms, fn) => {
    return (...args) => {
        return Promise.race([
            fn(...args),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout após ${ms}ms`)), ms)
            ),
        ]);
    };
});

/**
 * Safe execution wrapper
 */
export const safe =
    (fn) =>
    (...args) => {
        try {
            const result = fn(...args);
            if (result && typeof result.then === 'function') {
                return result
                    .then((value) => Either.right(value))
                    .catch((error) => Either.left(error));
            }
            return Either.right(result);
        } catch (error) {
            return Either.left(error);
        }
    };

/**
 * Memoização funcional
 */
export const memoizeWith = (keyFn) => (fn) => {
    const cache = new Map();

    return (...args) => {
        const key = keyFn(...args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
};

/**
 * Tap - executa efeito colateral sem alterar valor
 */
export const tap = curry((fn, value) => {
    fn(value);
    return value;
});

/**
 * Trace - log debugging funcional
 */
export const trace = curry((label, value) => {
    console.log(`${label}:`, value);
    return value;
});

/**
 * Conditional execution
 */
export const when = curry((predicate, fn, value) => (predicate(value) ? fn(value) : value));

export const unless = curry((predicate, fn, value) => (!predicate(value) ? fn(value) : value));

/**
 * Array utilities funcionais
 */
export const arrayHelpers = {
    /**
     * Chunking funcional
     */
    chunk: curry((size, array) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }),

    /**
     * Group by key
     */
    groupBy: curry((keyFn, array) => {
        return array.reduce((groups, item) => {
            const key = keyFn(item);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    }),

    /**
     * Unique by key
     */
    uniqueBy: curry((keyFn, array) => {
        const seen = new Set();
        return array.filter((item) => {
            const key = keyFn(item);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }),

    /**
     * Partition array
     */
    partition: curry((predicate, array) => [
        array.filter(predicate),
        array.filter((item) => !predicate(item)),
    ]),
};

/**
 * Object utilities funcionais
 */
export const objectHelpers = {
    /**
     * Deep map object values
     */
    mapValues: curry((fn, obj) => {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] =
                typeof value === 'object' && value !== null
                    ? objectHelpers.mapValues(fn, value)
                    : fn(value);
        }
        return result;
    }),

    /**
     * Pick properties
     */
    pick: curry((keys, obj) => {
        const result = {};
        keys.forEach((key) => {
            if (key in obj) {
                result[key] = obj[key];
            }
        });
        return result;
    }),

    /**
     * Omit properties
     */
    omit: curry((keys, obj) => {
        const result = { ...obj };
        keys.forEach((key) => delete result[key]);
        return result;
    }),
};

/**
 * Validation helpers funcionais
 */
export const validation = {
    /**
     * Validation result
     */
    success: (value) => ({ isValid: true, value, errors: [] }),
    failure: (errors) => ({
        isValid: false,
        value: null,
        errors: Array.isArray(errors) ? errors : [errors],
    }),

    /**
     * Combine validations
     */
    combine:
        (...validations) =>
        (value) => {
            const results = validations.map((validate) => validate(value));
            const errors = results.flatMap((result) => result.errors);

            return errors.length === 0 ? validation.success(value) : validation.failure(errors);
        },

    /**
     * Common validators
     */
    isRequired:
        (message = 'Campo obrigatório') =>
        (value) =>
            value !== null && value !== undefined && value !== ''
                ? validation.success(value)
                : validation.failure(message),

    isNumber:
        (message = 'Deve ser um número') =>
        (value) =>
            typeof value === 'number' && !isNaN(value)
                ? validation.success(value)
                : validation.failure(message),

    isPositive:
        (message = 'Deve ser positivo') =>
        (value) =>
            value > 0 ? validation.success(value) : validation.failure(message),

    maxLength:
        (max, message = `Máximo ${max} caracteres`) =>
        (value) =>
            value.length <= max ? validation.success(value) : validation.failure(message),
};

export default {
    compose,
    pipe,
    curry,
    partial,
    Maybe,
    Either,
    Task,
    retry,
    timeout,
    safe,
    memoizeWith,
    tap,
    trace,
    when,
    unless,
    arrayHelpers,
    objectHelpers,
    validation,
};

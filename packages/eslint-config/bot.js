const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type {import("eslint").Linter.Config} */
module.exports = {
    extends: ['neon/common', 'neon/node', 'neon/typescript', 'neon/prettier'],
    rules: {
        'import/extensions': 0,
        'typescript-sort-keys/interface': 'off',
        'object-shorthand': 'off',
        '@typescript-eslint/lines-between-class-members': 'off',
        'id-length': 'off',
        'unicorn/consistent-function-scoping': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        'unicorn/numeric-separators-style': 'off',
        'no-param-reassign': 'off',
        'require-atomic-updates': 'off',
        'unicorn/prefer-string-replace-all': 'off',
        '@typescript-eslint/no-loop-func': 'off',
        'prefer-exponentiation-operator': 'off',
        'promise/prefer-await-to-then': 'off',
    },
    settings: {
        'import/resolver': {
            typescript: {
                project,
            },
        },
    },
    ignorePatterns: ['.*.js', 'node_modules/', 'dist/', 'build/'],
    overrides: [{ files: ['*.js?(x)', '*.ts?(x)'] }],
};

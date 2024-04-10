const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "prettier",
    require.resolve("@vercel/style-guide/eslint/next"),
    "eslint-config-turbo",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@tanstack/eslint-plugin-query/recommended"
  ],
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    node: true,
    browser: true,
  },
  plugins: ["react"],
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [
    ".*.js",
    "node_modules/",
    "dist/",
    "build/",
  ],
  overrides: [{ files: ["*.js?(x)", "*.ts?(x)"] }],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
        "react/react-in-jsx-scope": "off",
        "arrow-spacing": [
            "warn",
            {
                "before": true,
                "after": true
            }
        ],
        "comma-dangle": ["error", "always-multiline"],
        "comma-spacing": "error",
        "comma-style": "error",
        "curly": ["error", "multi-line", "consistent"],
        "dot-location": ["error", "property"],
        "handle-callback-err": "off",
        "max-nested-callbacks": [
            "error",
            {
                "max": 4
            }
        ],
        "max-statements-per-line": [
            "error",
            {
                "max": 2
            }
        ],
        "no-console": "off",
        "no-empty-function": "error",
        "no-floating-decimal": "error",
        "no-inline-comments": "error",
        "no-lonely-if": "error",
        "no-multi-spaces": "error",
        "no-multiple-empty-lines": [
            "error",
            {
                "max": 2,
                "maxEOF": 1,
                "maxBOF": 0
            }
        ],
        "no-shadow": "off",
        "no-trailing-spaces": ["error"],
        "no-var": "error",
        "object-curly-spacing": ["error", "always"],
        "prefer-const": "error",
        "quotes": ["error", "single"],
        "semi": ["error", "always"],
        "space-before-blocks": "error",
        "space-before-function-paren": [
            "error",
            {
                "anonymous": "never",
                "named": "never",
                "asyncArrow": "always"
            }
        ],
        "space-in-parens": "error",
        "space-infix-ops": "error",
        "space-unary-ops": "error",
        "spaced-comment": "error",
        "yoda": "error",
        "@typescript-eslint/no-shadow": "warn"
    },
};

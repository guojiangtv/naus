module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "error",
            "space"
        ],
        "linebreak-style": [
            "off"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            2, "always"
        ]
    }
};
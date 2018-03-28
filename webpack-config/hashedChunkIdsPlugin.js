/*
    MIT License http://www.opensource.org/licenses/mit-license.php
    Author Tobias Koppers @sokra
*/
"use strict";
const createHash = require("crypto").createHash;

class HashedChunkIdsPlugin {
    constructor(options) {
        this.options = Object.assign({
            hashFunction: "md5",
            hashDigest: "base64",
            hashDigestLength: 6
        }, options);
    }

    apply(compiler) {
        compiler.plugin("compilation", (compilation) => {

            compilation.plugin("before-chunk-ids", (chunks) => {
                chunks.forEach((chunk) => {
                    chunk.id = chunk.name
                });
            });
        });
    }
}

module.exports = HashedChunkIdsPlugin;

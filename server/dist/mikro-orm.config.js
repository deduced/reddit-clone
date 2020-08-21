"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Post_1 = require("./entities/Post");
exports.default = {
    dbName: "reddit_clone",
    debug: process.env.NODE_ENV !== "production",
    entities: [Post_1.Post],
    type: "postgresql",
};
//# sourceMappingURL=mikro-orm.config.js.map
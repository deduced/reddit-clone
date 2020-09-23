"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuth2 = void 0;
exports.isAuth2 = ({ context }, next) => {
    if (!context.req.session.userId) {
        throw new Error("not authenticated");
    }
    return next();
};
//# sourceMappingURL=isAuth2.js.map
"use strict";
/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
exports.__esModule = true;
exports.getHeadData = void 0;
var utils_1 = require("@timecat/utils");
var pkg_1 = require("pkg");
function getHeadData() {
    return {
        href: location.href,
        title: document.title,
        relatedId: (0, utils_1.getRandomCode)(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        beginTime: (0, utils_1.getTime)(),
        version: pkg_1["default"].version
    };
}
exports.getHeadData = getHeadData;

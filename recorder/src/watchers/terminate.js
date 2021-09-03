"use strict";
/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.TerminateWatcher = void 0;
var share_1 = require("@timecat/share");
var watcher_1 = require("../watcher");
var TerminateWatcher = /** @class */ (function (_super) {
    __extends(TerminateWatcher, _super);
    function TerminateWatcher() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TerminateWatcher.prototype.init = function () {
        var _this = this;
        this.context.addEventListener('beforeunload', this.handleFn);
        this.uninstall(function () {
            _this.context.removeEventListener('beforeunload', _this.handleFn);
        });
    };
    TerminateWatcher.prototype.handleFn = function () {
        // do some sync job
        // navigator.sendBeacon(url, data)
        // this.emitData(this.wrapData())
    };
    TerminateWatcher.prototype.wrapData = function () {
        return [share_1.RecordType.TERMINATE, null];
    };
    return TerminateWatcher;
}(watcher_1.Watcher));
exports.TerminateWatcher = TerminateWatcher;

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
exports.CanvasSnapshotWatcher = void 0;
var share_1 = require("@timecat/share");
var watcher_1 = require("../../watcher");
var utils_1 = require("./utils");
var CanvasSnapshotWatcher = /** @class */ (function (_super) {
    __extends(CanvasSnapshotWatcher, _super);
    function CanvasSnapshotWatcher() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CanvasSnapshotWatcher.prototype.init = function () {
        var _this = this;
        var canvasElements = document.getElementsByTagName('canvas');
        Array.from(canvasElements).forEach(function (canvas) {
            _this.snapshotCanvas(canvas);
        });
    };
    CanvasSnapshotWatcher.prototype.snapshotCanvas = function (canvas) {
        if ((0, utils_1.isCanvasBlank)(canvas)) {
            return;
        }
        var dataURL = canvas.toDataURL();
        this.emitData(share_1.RecordType.CANVAS_SNAPSHOT, {
            id: this.getNodeId(canvas),
            src: dataURL
        });
    };
    return CanvasSnapshotWatcher;
}(watcher_1.Watcher));
exports.CanvasSnapshotWatcher = CanvasSnapshotWatcher;

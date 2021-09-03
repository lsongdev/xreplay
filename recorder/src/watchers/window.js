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
exports.WindowWatcher = void 0;
var share_1 = require("@timecat/share");
var watcher_1 = require("../watcher");
var WindowWatcher = /** @class */ (function (_super) {
    __extends(WindowWatcher, _super);
    function WindowWatcher() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WindowWatcher.prototype.width = function () {
        return this.context.innerWidth;
    };
    WindowWatcher.prototype.height = function () {
        return this.context.innerHeight;
    };
    WindowWatcher.prototype.init = function () {
        this.emitData.apply(this, this.wrapData(null));
        this.registerEvent({
            context: this.context,
            eventTypes: ['resize'],
            handleFn: this.handleFn.bind(this),
            listenerOptions: { capture: true },
            type: 'throttle',
            optimizeOptions: { trailing: true },
            waitTime: 500
        });
    };
    WindowWatcher.prototype.handleFn = function (e) {
        var type = e.type, target = e.target;
        var id = null;
        if (target && target instanceof HTMLElement) {
            if (target.constructor.name === HTMLVideoElement.name) {
                return;
            }
            id = this.getNodeId(target);
        }
        if (type === 'resize') {
            this.emitData.apply(this, this.wrapData(id));
        }
    };
    WindowWatcher.prototype.wrapData = function (id) {
        return [
            share_1.RecordType.WINDOW,
            {
                id: id,
                width: this.width(),
                height: this.height()
            }
        ];
    };
    return WindowWatcher;
}(watcher_1.Watcher));
exports.WindowWatcher = WindowWatcher;

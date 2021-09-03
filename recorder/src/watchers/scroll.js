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
exports.ScrollWatcher = void 0;
var share_1 = require("@timecat/share");
var watcher_1 = require("../watcher");
var ScrollWatcher = /** @class */ (function (_super) {
    __extends(ScrollWatcher, _super);
    function ScrollWatcher() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ScrollWatcher.prototype.getCompatibleTarget = function (target) {
        return target.scrollingElement || target.documentElement;
    };
    ScrollWatcher.prototype.scrollTop = function (target) {
        return target.scrollTop;
    };
    ScrollWatcher.prototype.scrollLeft = function (target) {
        return target.scrollLeft;
    };
    ScrollWatcher.prototype.init = function () {
        var scrollingElement = this.context.document.scrollingElement;
        this.emitData.apply(this, this.wrapData(scrollingElement || document, true));
        this.registerEvent({
            context: this.context,
            eventTypes: ['scroll'],
            handleFn: this.handleFn.bind(this),
            listenerOptions: { capture: true },
            type: 'throttle',
            optimizeOptions: { leading: true, trailing: true },
            waitTime: 300
        });
    };
    ScrollWatcher.prototype.wrapData = function (target, isAuto) {
        if (isAuto === void 0) { isAuto = false; }
        var element = target instanceof this.context.HTMLElement ? target : this.getCompatibleTarget(target);
        var data = {
            id: this.getNodeId(element) || null,
            top: this.scrollTop(element),
            left: this.scrollLeft(element)
        };
        if (isAuto) {
            data.behavior = 'auto';
        }
        return [share_1.RecordType.SCROLL, data];
    };
    ScrollWatcher.prototype.handleFn = function (e) {
        var type = e.type, target = e.target;
        if (type === 'scroll') {
            this.emitData.apply(this, this.wrapData(target));
        }
    };
    return ScrollWatcher;
}(watcher_1.Watcher));
exports.ScrollWatcher = ScrollWatcher;

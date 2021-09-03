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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.MouseWatcher = void 0;
var utils_1 = require("@timecat/utils");
var share_1 = require("@timecat/share");
var watcher_1 = require("../watcher");
var MouseWatcher = /** @class */ (function (_super) {
    __extends(MouseWatcher, _super);
    function MouseWatcher() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MouseWatcher.prototype.init = function () {
        this.mouseMove();
        this.mouseClick();
        this.detectScrolling();
    };
    MouseWatcher.prototype.detectScrolling = function () {
        var _this = this;
        var timer;
        var evt = function () {
            _this.scrolling = true;
            clearTimeout(timer);
            timer = _this.context.setTimeout(function () {
                _this.scrolling = false;
                if (_this.latestMove) {
                    _this.sendMoveData(_this.latestMove);
                    _this.latestMove = null;
                }
            }, 500);
        };
        var eventNames = ['mousewheel', 'scroll'];
        eventNames.forEach(function (name) {
            _this.context.addEventListener(name, evt, true);
            _this.uninstall(function () {
                _this.context.removeEventListener(name, evt, true);
            });
        });
    };
    MouseWatcher.prototype.sendMoveData = function (position) {
        var x = position.x, y = position.y, id = position.id;
        this.emitData(share_1.RecordType.MOUSE, {
            type: share_1.MouseEventType.MOVE,
            id: id,
            x: x,
            y: y
        });
    };
    MouseWatcher.prototype.mouseMove = function () {
        var _this = this;
        var evt = function (e) {
            var offsetPosition = _this.getOffsetPosition(e, _this.context);
            if (_this.scrolling) {
                _this.latestMove = offsetPosition;
                return;
            }
            offsetPosition && _this.sendMoveData(offsetPosition);
        };
        var name = 'mousemove';
        var listenerHandle = (0, utils_1.throttle)(evt, 300, {
            trailing: true,
            leading: true
        });
        this.context.addEventListener(name, listenerHandle);
        this.uninstall(function () {
            _this.context.removeEventListener(name, listenerHandle);
        });
    };
    MouseWatcher.prototype.mouseClick = function () {
        var _this = this;
        var evt = function (e) {
            var offsetPosition = _this.getOffsetPosition(e, _this.context);
            if (offsetPosition) {
                _this.emitData(share_1.RecordType.MOUSE, __assign({ type: share_1.MouseEventType.CLICK }, offsetPosition));
            }
        };
        var name = 'click';
        var listenerHandle = (0, utils_1.throttle)(evt, 250);
        this.uninstall(function () {
            _this.context.removeEventListener(name, listenerHandle);
        });
        this.context.addEventListener(name, listenerHandle);
    };
    MouseWatcher.prototype.getOffsetPosition = function (event, context) {
        var _a;
        var mode = context.G_RECORD_OPTIONS.mode;
        var view = event.view, target = event.target, x = event.x, y = event.y, offsetX = event.offsetX, offsetY = event.offsetY;
        if (view === context) {
            var doc = target.ownerDocument;
            function isInline(target) {
                return context.getComputedStyle(target).display === 'inline';
            }
            // https://stackoverflow.com/questions/8270612/get-element-moz-transformrotate-value-in-jquery
            function getRotate(node) {
                if (!(0, utils_1.isExistingNode)(node)) {
                    return 0;
                }
                var computedStyle = context.getComputedStyle(node);
                var matrix = computedStyle['transform'];
                var angle;
                if (matrix !== 'none') {
                    var values = matrix.split('(')[1].split(')')[0].split(',');
                    var a = Number(values[0]);
                    var b = Number(values[1]);
                    angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
                }
                else {
                    angle = 0;
                }
                return angle < 0 ? angle + 360 : angle;
            }
            var node = target;
            var id = undefined;
            if ((0, utils_1.isExistingNode)(node)) {
                while (isInline(node)) {
                    node = node.parentElement;
                }
                id = this.getNodeId(node);
            }
            var deg = getRotate(node);
            var position = void 0;
            if (deg || !id) {
                return null;
            }
            else {
                position = {
                    id: id,
                    x: offsetX,
                    y: offsetY
                };
            }
            var frameElement_1 = (_a = doc === null || doc === void 0 ? void 0 : doc.defaultView) === null || _a === void 0 ? void 0 : _a.frameElement;
            if (frameElement_1 && mode === 'default') {
                var rect = frameElement_1.getBoundingClientRect();
                position.y += rect.top;
                position.x += rect.left;
            }
            return position;
        }
        return false;
    };
    return MouseWatcher;
}(watcher_1.Watcher));
exports.MouseWatcher = MouseWatcher;

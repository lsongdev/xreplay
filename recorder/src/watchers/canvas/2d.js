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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.Canvas2DWatcher = void 0;
var share_1 = require("@timecat/share");
var utils_1 = require("@timecat/utils");
var proxy_1 = require("../../proxy");
var watcher_1 = require("../../watcher");
var utils_2 = require("./utils");
var Canvas2DWatcher = /** @class */ (function (_super) {
    __extends(Canvas2DWatcher, _super);
    function Canvas2DWatcher() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.aggregateDataEmitter = _this.strokesManager(function (id, strokes) {
            _this.emitData(share_1.RecordType.CANVAS, {
                id: id,
                strokes: strokes
            });
        });
        return _this;
    }
    Canvas2DWatcher.prototype.getCanvasInitState = function (ctx) {
        var keys = utils_1.canvasContext2DAttrs;
        return Object.values(keys).reduce(function (obj, key) {
            var _a;
            return __assign(__assign({}, obj), (_a = {}, _a[key] = ctx[key], _a));
        }, {});
    };
    Canvas2DWatcher.prototype.init = function () {
        this.watchCreatedCanvas();
        this.watchCreatingCanvas();
    };
    Canvas2DWatcher.prototype.watchCreatedCanvas = function () {
        var _this = this;
        var canvasElements = document.getElementsByTagName('canvas');
        Array.from(canvasElements).forEach(function (canvas) {
            if ((0, utils_2.isCanvasBlank)(canvas)) {
                (0, utils_2.detectCanvasContextType)(canvas, function (contextId) {
                    if (contextId === '2d') {
                        _this.watchCanvas(canvas);
                    }
                });
            }
            else {
                _this.watchCanvas(canvas);
            }
        });
    };
    Canvas2DWatcher.prototype.watchCreatingCanvas = function () {
        var _this = this;
        var callback = function (canvas) {
            (0, utils_2.detectCanvasContextType)(canvas, function (contextId) {
                if (contextId === '2d') {
                    _this.watchCanvas(canvas);
                }
            });
        };
        proxy_1.proxyCreateCanvasElement.call(this, callback);
        this.uninstall(function () { return (0, proxy_1.removeProxies)(); });
    };
    Canvas2DWatcher.prototype.watchCanvas = function (canvasElement) {
        var _this = this;
        var self = this;
        var ctxProto = CanvasRenderingContext2D.prototype;
        var names = utils_1.canvasContext2DKeys;
        var ctx = canvasElement.getContext('2d');
        if (!ctx) {
            return;
        }
        this.emitData(share_1.RecordType.CANVAS, {
            id: this.getNodeId(ctx.canvas),
            status: this.getCanvasInitState(ctx)
        });
        var ctxTemp = {};
        names.forEach(function (name) {
            var original = Object.getOwnPropertyDescriptor(ctxProto, name);
            var method = original.value;
            var val = ctx[name];
            ctxTemp[name] = val;
            var descriptor = Object.getOwnPropertyDescriptor(ctx, name);
            if (descriptor && (!descriptor.configurable || descriptor.get)) {
                return;
            }
            Object.defineProperty(ctx, name, {
                get: function () {
                    var context = this;
                    var id = self.getNodeId(this.canvas);
                    return typeof method === 'function'
                        ? function () {
                            var _a;
                            var args = __spreadArray([], arguments, true);
                            if (name === 'createPattern') {
                                args[0] = id;
                            }
                            else if (name === 'drawImage') {
                                var elType = (_a = args[0]) === null || _a === void 0 ? void 0 : _a.constructor.name;
                                if (elType === 'HTMLCanvasElement') {
                                    var dataUrl = args[0].toDataURL();
                                    args[0] = dataUrl;
                                }
                                else if (elType === 'HTMLImageElement') {
                                    var img = args[0];
                                    img.setAttribute('crossorigin', 'anonymous');
                                    var imgCanvas = document.createElement('canvas', false);
                                    imgCanvas.width = img.width;
                                    imgCanvas.height = img.height;
                                    var ctx_1 = imgCanvas.getContext('2d');
                                    ctx_1.drawImage(img, 0, 0, img.width, img.height);
                                    args[0] = imgCanvas.toDataURL();
                                }
                            }
                            self.aggregateDataEmitter(id, name, args);
                            return method.apply(context, arguments);
                        }
                        : ctxTemp[name];
                },
                set: function (value) {
                    var _a;
                    var id = self.getNodeId(this.canvas);
                    if (typeof value !== 'function') {
                        self.aggregateDataEmitter(id, name, value);
                    }
                    ctxTemp[name] = value;
                    return (_a = original.set) === null || _a === void 0 ? void 0 : _a.apply(this, arguments);
                },
                configurable: true
            });
            _this.uninstall(function () {
                Object.defineProperty(ctx, name, descriptor || original);
            });
        });
    };
    Canvas2DWatcher.prototype.strokesManager = function (func, wait) {
        if (wait === void 0) { wait = 30; }
        var tasks = Object.create(null);
        var timeouts = Object.create(null);
        var blockInstances = [CanvasGradient, CanvasPattern];
        return function (id, name, args) {
            if (!id) {
                return;
            }
            var canvas = utils_1.nodeStore.getNode(id);
            if (!canvas) {
                return;
            }
            var context = this;
            var clearRectIndex = utils_1.canvasContext2DKeys.indexOf('clearRect');
            var emitStrokes = function (id) {
                var timeout = timeouts[id];
                clearTimeout(timeout);
                timeouts[id] = 0;
                var strokes = tasks[id].slice();
                // Ignore duplicate rendering
                var _a = canvas.getBoundingClientRect(), canvasWidth = _a.width, canvasHeight = _a.height;
                var clearIndex = strokes.reverse().findIndex(function (stroke) {
                    if (stroke.name === clearRectIndex) {
                        var args_1 = stroke.args;
                        if (args_1[0] === 0 && args_1[1] === 0 && args_1[2] === canvasWidth && args_1[3] === canvasHeight) {
                            return true;
                        }
                    }
                });
                var latestStrokes = !~clearIndex ? strokes.reverse() : strokes.slice(0, clearIndex + 1).reverse();
                func.call(context, id, latestStrokes);
                tasks[id].length = 0;
            };
            if (!tasks[id]) {
                tasks[id] = [];
            }
            if (!blockInstances.some(function (instance) { return args instanceof instance; })) {
                var index = utils_1.canvasContext2DKeys.indexOf(name);
                tasks[id].push({
                    name: index,
                    args: args
                });
            }
            if (!timeouts[id]) {
                var timeout = window.setTimeout(function () {
                    emitStrokes(id);
                }, wait);
                timeouts[id] = timeout;
            }
        };
    };
    return Canvas2DWatcher;
}(watcher_1.Watcher));
exports.Canvas2DWatcher = Canvas2DWatcher;

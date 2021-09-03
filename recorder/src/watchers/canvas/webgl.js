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
exports.CanvasWebGLWatcher = void 0;
var share_1 = require("@timecat/share");
var utils_1 = require("@timecat/utils");
var proxy_1 = require("../../proxy");
var watcher_1 = require("../../watcher");
var utils_2 = require("./utils");
var WebGLConstructors = [
    WebGLActiveInfo,
    WebGLBuffer,
    WebGLFramebuffer,
    WebGLProgram,
    WebGLRenderbuffer,
    WebGLShader,
    WebGLShaderPrecisionFormat,
    WebGLTexture,
    WebGLUniformLocation
    // WebGLVertexArrayObject
];
var CanvasWebGLWatcher = /** @class */ (function (_super) {
    __extends(CanvasWebGLWatcher, _super);
    function CanvasWebGLWatcher() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.GLVars = Object.create(null);
        _this.emitStroke = (0, utils_2.strokesManager)({
            keys: utils_1.canvasContextWebGLKeys,
            wait: 20,
            blockInstances: [],
            fn: function (id, args) {
                args = _this.parseArgs(args);
                _this.emitData(share_1.RecordType.WEBGL, {
                    id: id,
                    args: args
                });
            }
        });
        return _this;
    }
    CanvasWebGLWatcher.prototype.init = function () {
        // this.watchCreatedCanvas()
        // this.watchCreatingCanvas()
        this.patchWebGLProto(WebGLRenderingContext.prototype);
        if (window.WebGL2RenderingContext !== undefined) {
            this.patchWebGLProto(WebGL2RenderingContext.prototype);
        }
    };
    CanvasWebGLWatcher.prototype.patchWebGLProto = function (proto) {
        var _this = this;
        Object.getOwnPropertyNames(proto).forEach(function (name) {
            if (name === 'canvas' || name === 'constructor') {
                return;
            }
            if (proto.__lookupGetter__(name) !== undefined) {
                return;
            }
            if (typeof proto[name] === 'function') {
                _this.patchProtoFunc(proto, name);
            }
        });
    };
    CanvasWebGLWatcher.prototype.patchProtoFunc = function (proto, name) {
        var original = proto[name];
        var self = this;
        if ('isPatch' in original) {
            return;
        }
        var patch = function () {
            var _this = this;
            var ret = original.apply(this, arguments);
            var args = __spreadArray([], arguments, true);
            setTimeout(function () {
                var canvas = _this.canvas;
                var id = self.getNodeId(canvas) || utils_1.nodeStore.addNode(canvas);
                self.emitStroke(id, name, args);
            });
            return ret;
        };
        patch.isPatch = true;
        proto[name] = patch;
        this.uninstall(function () {
            delete patch.isPatch;
            proto[name] = original;
        });
    };
    CanvasWebGLWatcher.prototype.watchCreatedCanvas = function () {
        var _this = this;
        var canvasElements = document.getElementsByTagName('canvas');
        Array.from(canvasElements).forEach(function (canvas) {
            if ((0, utils_2.isCanvasBlank)(canvas)) {
                (0, utils_2.detectCanvasContextType)(canvas, function (contextId) {
                    if (contextId === 'webgl' || contextId === 'experimental-webgl') {
                        _this.watchCanvas(canvas);
                    }
                });
            }
        });
    };
    CanvasWebGLWatcher.prototype.watchCreatingCanvas = function () {
        var _this = this;
        var callback = function (canvas) {
            (0, utils_2.detectCanvasContextType)(canvas, function (contextId) {
                if (contextId === 'webgl' || contextId === 'experimental-webgl') {
                    _this.watchCanvas(canvas);
                }
            });
        };
        proxy_1.proxyCreateCanvasElement.call(this, callback);
        this.uninstall(function () { return (0, proxy_1.removeProxies)(); });
    };
    CanvasWebGLWatcher.prototype.watchCanvas = function (canvasElement) {
        var self = this;
        var ctxProto = WebGLRenderingContext.prototype;
        var ctx = canvasElement.getContext('webgl') || canvasElement.getContext('experimental-webgl');
        if (!ctx) {
            return;
        }
        var ctxTemp = {};
        var _loop_1 = function (key) {
            var name_1 = key;
            if (name_1 === 'canvas') {
                return "continue";
            }
            if (key === 'drawingBufferHeight' || key === 'drawingBufferWidth') {
                return "continue";
            }
            var original = Object.getOwnPropertyDescriptor(ctxProto, name_1);
            var value = original.value;
            ctxTemp[name_1] = value;
            var descriptor = Object.getOwnPropertyDescriptor(ctx, name_1);
            if (descriptor && (!descriptor.configurable || descriptor.get)) {
                return { value: void 0 };
            }
            Object.defineProperty(ctx, name_1, {
                get: function () {
                    var context = this;
                    return typeof value === 'function'
                        ? function () {
                            var args = __spreadArray([], arguments, true);
                            setTimeout(function () {
                                var id = self.getNodeId(context.canvas) || utils_1.nodeStore.addNode(canvasElement);
                                self.emitStroke(id, name_1, args);
                            });
                            return value.apply(context, arguments);
                        }
                        : ctxTemp[name_1];
                },
                set: function (value) {
                    var _this = this;
                    var _a;
                    setTimeout(function () {
                        var id = self.getNodeId(_this.canvas) || utils_1.nodeStore.addNode(canvasElement);
                        if (typeof value !== 'function') {
                            _this.emitStroke(id, name_1, value);
                        }
                    });
                    ctxTemp[name_1] = value;
                    return (_a = original.set) === null || _a === void 0 ? void 0 : _a.apply(this, arguments);
                },
                configurable: true
            });
            this_1.uninstall(function () {
                Object.defineProperty(ctx, name_1, descriptor || original);
            });
        };
        var this_1 = this;
        for (var key in ctx) {
            var state_1 = _loop_1(key);
            if (typeof state_1 === "object")
                return state_1.value;
        }
    };
    CanvasWebGLWatcher.prototype.parseArgs = function (argsList) {
        var _this = this;
        return argsList.map(function (_a) {
            var name = _a.name, args = _a.args;
            return {
                name: name,
                args: args.map(function (arg) { return _this.getWebGLVariable(arg); })
            };
        });
    };
    // inspired by https://github.com/evanw/webgl-recorder/blob/master/webgl-recorder.js
    CanvasWebGLWatcher.prototype.getWebGLVariable = function (arg) {
        if (ArrayBuffer.isView(arg)) {
            return '$f32arr' + Array.prototype.slice.call(arg);
        }
        else if (arg instanceof Array) {
            return '$arr' + Array.prototype.slice.call(arg);
        }
        else if (arg instanceof HTMLImageElement) {
            return '$src@' + arg.src;
        }
        else if (WebGLConstructors.some(function (ctor) { return arg instanceof ctor; }) ||
            (typeof arg === 'object' && arg !== null) ||
            (arg && arg.constructor.name === 'WebGLVertexArrayObjectOES')) {
            var ctorName = arg.constructor.name;
            var glVars = this.GLVars[ctorName] || (this.GLVars[ctorName] = []);
            var index = glVars.indexOf(arg);
            if (!~index) {
                index = glVars.length;
                glVars.push(arg);
            }
            return '$' + ctorName + '@' + index;
        }
        return arg;
    };
    return CanvasWebGLWatcher;
}(watcher_1.Watcher));
exports.CanvasWebGLWatcher = CanvasWebGLWatcher;

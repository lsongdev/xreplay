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
exports.LocationWatcher = void 0;
var share_1 = require("@timecat/share");
var watcher_1 = require("../watcher");
var MethodType;
(function (MethodType) {
    MethodType["add"] = "add";
    MethodType["rm"] = "rm";
})(MethodType || (MethodType = {}));
var LocationTypes;
(function (LocationTypes) {
    LocationTypes["replaceState"] = "replaceState";
    LocationTypes["pushState"] = "pushState";
    LocationTypes["popstate"] = "popstate";
    LocationTypes["hashchange"] = "hashchange";
})(LocationTypes || (LocationTypes = {}));
var LocationWatcher = /** @class */ (function (_super) {
    __extends(LocationWatcher, _super);
    function LocationWatcher() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.locationHandle = function (e) {
            var _a, _b;
            var contextNodeId = _this.getContextNodeId(e);
            var _c = e.arguments || [, , (_b = (_a = _this.context) === null || _a === void 0 ? void 0 : _a.location) === null || _b === void 0 ? void 0 : _b.pathname], path = _c[2];
            var base = _this.context.document.body.getElementsByTagName('base')[0];
            var _d = _this.context.location, href = _d.href, hash = _d.hash;
            var title = document.title;
            _this.emitData(share_1.RecordType.LOCATION, {
                contextNodeId: contextNodeId,
                href: (base === null || base === void 0 ? void 0 : base.href) || href,
                hash: hash,
                path: path,
                title: title
            });
        };
        _this.emitOne = function () { return _this.locationHandle({ target: window }); };
        return _this;
    }
    LocationWatcher.prototype.init = function () {
        var _this = this;
        this.context.history.pushState = this.kidnapLocation(LocationTypes.pushState);
        this.context.history.replaceState = this.kidnapLocation(LocationTypes.replaceState);
        var types = Object.values(LocationTypes);
        types.forEach(function (type) { return _this.toggleListener(MethodType.add, type, _this.locationHandle); });
        this.uninstall(function () {
            types.forEach(function (type) { return _this.toggleListener(MethodType.rm, type, _this.locationHandle); });
        });
    };
    LocationWatcher.prototype.toggleListener = function (methodType, type, handle) {
        this.context[methodType === MethodType.add ? 'addEventListener' : 'removeEventListener'](type, handle);
    };
    LocationWatcher.prototype.kidnapLocation = function (type) {
        var ctx = this.context;
        var original = ctx.history[type];
        return function () {
            var result = original.apply(this, arguments);
            var e = new Event(type);
            e.arguments = arguments;
            ctx.dispatchEvent(e);
            return result;
        };
    };
    LocationWatcher.prototype.getContextNodeId = function (e) {
        return this.getNodeId(e.target.document.documentElement);
    };
    return LocationWatcher;
}(watcher_1.Watcher));
exports.LocationWatcher = LocationWatcher;

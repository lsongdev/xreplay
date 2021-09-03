"use strict";
/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
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
exports.Pluginable = void 0;
var tapable_1 = require("tapable");
var utils_1 = require("@timecat/utils");
var HookStatus;
(function (HookStatus) {
    HookStatus["beforeRun"] = "beforeRun";
    HookStatus["run"] = "run";
    HookStatus["emit"] = "emit";
    HookStatus["end"] = "end";
})(HookStatus || (HookStatus = {}));
var Pluginable = /** @class */ (function () {
    function Pluginable(options) {
        var _this = this;
        this.defaultPlugins = []; // todo
        this.pluginWatchers = [];
        this.checkHookAvailable = function () {
            try {
                new tapable_1.SyncHook().call();
                return true;
            }
            catch (error) {
                (0, utils_1.logError)("Plugin hooks is not available in the current env, because " + error);
            }
        };
        this.plugin = function (type, cb) {
            var name = _this.hooks[type].constructor.name;
            var method = /Async/.test(name) ? 'tapAsync' : 'tap';
            _this.hooks[type][method](type, cb);
        };
        this.plugins = [];
        this.initPlugin(options);
        var DEFAULT_HOOKS = {
            beforeRun: new tapable_1.SyncHook(),
            run: new tapable_1.SyncHook(),
            emit: new tapable_1.SyncHook(['data']),
            end: new tapable_1.SyncHook()
        };
        var HOOKS = this.checkHookAvailable()
            ? DEFAULT_HOOKS
            : Object.keys(DEFAULT_HOOKS).reduce(function (obj, key) {
                var _a;
                return __assign(__assign({}, obj), (_a = {}, _a[key] = function () { }, _a));
            }, {});
        this.hooks = HOOKS;
    }
    Pluginable.prototype.use = function (plugin) {
        this.plugins.push(plugin);
    };
    Pluginable.prototype.initPlugin = function (options) {
        var _a;
        var plugins = (options || {}).plugins;
        (_a = this.plugins).push.apply(_a, __spreadArray(__spreadArray([], this.defaultPlugins, false), (plugins || []), false));
    };
    Pluginable.prototype.loadPlugins = function () {
        var _this = this;
        this.plugins.forEach(function (plugin) {
            plugin.apply.call(plugin, _this);
        });
    };
    Pluginable.prototype.addWatcher = function (watcher) {
        this.pluginWatchers.push(watcher);
    };
    return Pluginable;
}());
exports.Pluginable = Pluginable;

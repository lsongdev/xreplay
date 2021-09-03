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
exports.Snapshot = void 0;
var watcher_1 = require("./watcher");
var share_1 = require("@timecat/share");
var virtual_dom_1 = require("@timecat/virtual-dom");
var utils_1 = require("@timecat/utils");
var common_1 = require("./common");
var Snapshot = /** @class */ (function (_super) {
    __extends(Snapshot, _super);
    function Snapshot() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Snapshot.prototype.init = function () {
        var snapshotData = this.DOMSnapshotData(this.options.context || window);
        var time = (0, utils_1.getTime)();
        this.checkNodesData(snapshotData, time);
        this.emitData(share_1.RecordType.SNAPSHOT, snapshotData, time);
    };
    Snapshot.prototype.DOMSnapshotData = function (context) {
        return __assign({ vNode: (0, virtual_dom_1.createElement)(context.document.documentElement) }, this.getInitInfo(context));
    };
    Snapshot.prototype.getInitInfo = function (context) {
        var _a = context.document.doctype || {}, name = _a.name, publicId = _a.publicId, systemId = _a.systemId;
        var doctype = function () { return ({ name: name, publicId: publicId, systemId: systemId }); };
        var href = function () { return context.location.href; };
        var width = function () { return context.innerWidth; };
        var height = function () { return context.innerHeight; };
        var scrollTop = function () { return context.pageYOffset; };
        var scrollLeft = function () { return context.pageXOffset; };
        var base = document.getElementsByTagName('base')[0];
        var getFrameElement = function () { return context.frameElement; };
        var frameElement = getFrameElement();
        var frameId = utils_1.nodeStore.getNodeId(frameElement) || null;
        var baseHref = base === null || base === void 0 ? void 0 : base.href;
        return {
            doctype: doctype(),
            href: baseHref || href(),
            scrollTop: scrollTop(),
            scrollLeft: scrollLeft(),
            width: width(),
            height: height(),
            frameId: frameId
        };
    };
    Snapshot.prototype.checkNodesData = function (_a, time) {
        var _this = this;
        var vNode = _a.vNode;
        var options = window.G_RECORD_OPTIONS;
        var configs = (options === null || options === void 0 ? void 0 : options.rewriteResource) || [];
        if (!(configs === null || configs === void 0 ? void 0 : configs.length)) {
            return;
        }
        var deepLoopChildNodes = function (children) {
            var vNodes = [];
            children.forEach(function (child) {
                var c = child;
                if ((0, utils_1.isVNode)(c)) {
                    vNodes.push.apply(vNodes, __spreadArray([c], deepLoopChildNodes(c.children), false));
                }
            });
            return vNodes;
        };
        (0, common_1.rewriteNodes)(deepLoopChildNodes(vNode.children), configs, function (data) {
            _this.emitData(share_1.RecordType.PATCH, data, time + 1);
        });
    };
    return Snapshot;
}(watcher_1.Watcher));
exports.Snapshot = Snapshot;

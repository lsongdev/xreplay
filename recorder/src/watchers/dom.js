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
exports.DOMWatcher = void 0;
var virtual_dom_1 = require("@timecat/virtual-dom");
var utils_1 = require("@timecat/utils");
var share_1 = require("@timecat/share");
var watcher_1 = require("../watcher");
var common_1 = require("../common");
var DOMWatcher = /** @class */ (function (_super) {
    __extends(DOMWatcher, _super);
    function DOMWatcher() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DOMWatcher.prototype.init = function () {
        var _this = this;
        var Watcher = new MutationObserver(function (callback) { return _this.mutationCallback(callback); });
        Watcher.observe(this.context.document.documentElement, {
            attributeOldValue: true,
            attributes: true,
            characterData: true,
            characterDataOldValue: true,
            childList: true,
            subtree: true
        });
        this.uninstall(function () { return Watcher.disconnect(); });
    };
    DOMWatcher.prototype.mutationCallback = function (records) {
        var _this = this;
        var addNodesSet = new Set();
        var removeNodesMap = new Map();
        var moveNodesSet = new Set();
        var moveMarkSet = new Set();
        // A node may modify multiple attributes, so use array(not set)
        var attrNodesArray = [];
        var textNodesSet = new Set();
        var context = this;
        function deepAdd(n, target) {
            var id = context.getNodeId(n);
            if (id) {
                if (target) {
                    // if exist, go to move and delete in removedSet
                    moveNodesSet.add(n);
                    removeNodesMap["delete"](n);
                    var targetId = context.getNodeId(target);
                    if (targetId) {
                        // mark as entry
                        moveMarkSet.add(targetId + '@' + id);
                    }
                }
            }
            else {
                addNodesSet.add(n);
            }
            n.childNodes.forEach(function (cn) { return deepAdd(cn); });
        }
        function deepDeleteInSet(set, n) {
            set["delete"](n);
            n.childNodes.forEach(function (cn) {
                deepDeleteInSet(set, cn);
            });
        }
        function rmNode(n, target) {
            if (!n) {
                return;
            }
            var id = context.getNodeId(n);
            var pId = context.getNodeId(n.parentNode);
            // shaking node if it hasn't joined the tree
            if (addNodesSet.has(n)) {
                deepDeleteInSet(addNodesSet, n);
                removeNodesMap.set(n, target);
            }
            else if (moveNodesSet.has(n) && moveMarkSet.has(pId + '@' + id)) {
                deepDeleteInSet(moveNodesSet, n);
                moveMarkSet["delete"](pId + '@' + id);
            }
            else {
                removeNodesMap.set(n, target);
            }
        }
        records.forEach(function (record) {
            var target = record.target, addedNodes = record.addedNodes, removedNodes = record.removedNodes, type = record.type, attributeName = record.attributeName, oldValue = record.oldValue;
            switch (type) {
                case 'attributes':
                    attrNodesArray.push({ key: attributeName, node: target, oldValue: oldValue });
                    break;
                case 'characterData':
                    textNodesSet.add(target);
                    break;
                case 'childList':
                    addedNodes.forEach(function (n) { return deepAdd(n, target); });
                    removedNodes.forEach(function (n) { return rmNode(n, target); });
                    break;
                default:
                    break;
            }
        });
        var addedNodes = [];
        var addedVNodesMap = new Map();
        addNodesSet.forEach(function (node) {
            var parentId = _this.getNodeId(node.parentNode);
            var id = utils_1.nodeStore.getNodeId(node);
            var vn = id ? (0, virtual_dom_1.getVNode)(node, { id: id }) : (0, virtual_dom_1.createFlatVNode)(node);
            if ((0, utils_1.isVNode)(vn)) {
                var name_1 = node.constructor.name;
                if (name_1.startsWith('SVG')) {
                    ;
                    vn.extra.isSVG = true;
                }
            }
            addedNodes.push({
                parentId: parentId,
                nextId: _this.getNodeId(node.nextSibling) || null,
                node: vn
            });
            if ((0, utils_1.isVNode)(vn)) {
                addedVNodesMap.set(vn.id, vn);
            }
        });
        var movedNodes = [];
        moveNodesSet.forEach(function (node) {
            var nodeId = _this.getNodeId(node);
            movedNodes.push({
                parentId: _this.getNodeId(node.parentNode),
                nextId: _this.getNodeId(node.nextSibling) || null,
                id: nodeId
            });
        });
        var removedNodes = [];
        removeNodesMap.forEach(function (parent, node) {
            var id = _this.getNodeId(node);
            var parentId = _this.getNodeId(parent);
            if (id && parentId) {
                removedNodes.push({
                    parentId: parentId,
                    id: id
                });
            }
        });
        var attrs = attrNodesArray
            .map(function (data) {
            var node = data.node, key = data.key, oldValue = data.oldValue;
            if ((0, utils_1.isExistingNode)(node)) {
                var value = node.getAttribute(key);
                if (oldValue === value) {
                    return null;
                }
                var id = _this.getNodeId(node);
                if (node.tagName === 'IFRAME' && key === 'src') {
                    _this.waitAndRecordIFrame(node);
                }
                return {
                    id: id,
                    key: key,
                    value: value
                };
            }
        })
            .filter(Boolean);
        var texts = __spreadArray([], textNodesSet, true).map(function (textNode) {
            if ((0, utils_1.isExistingNode)(textNode) && textNode.parentNode) {
                return {
                    id: _this.getNodeId(textNode),
                    parentId: _this.getNodeId(textNode.parentNode),
                    value: textNode.textContent
                };
            }
        })
            .filter(Boolean);
        var data = {
            addedNodes: addedNodes,
            movedNodes: movedNodes,
            removedNodes: removedNodes,
            attrs: attrs,
            texts: texts
        };
        Object.keys(data).forEach(function (type) {
            if (!data[type].length) {
                delete data[type];
            }
        });
        var time = (0, utils_1.getTime)();
        if (data.addedNodes) {
            // this.watchCanvas(addedNodes)
            this.watchIFrames(addedNodes);
            this.rewriteAddedSource(addedNodes, time);
        }
        if (Object.values(data).some(function (item) { return item.length; })) {
            this.emitData(share_1.RecordType.DOM, data, time);
        }
    };
    DOMWatcher.prototype.waitAndRecordIFrame = function (iframe) {
        var _this = this;
        var _a, _b;
        var contentWindow = iframe.contentWindow;
        (_b = (_a = iframe) === null || _a === void 0 ? void 0 : _a.frameRecorder) === null || _b === void 0 ? void 0 : _b.destroy();
        var onLoadHandle = function () {
            _this.recorder.recordIFrame(contentWindow);
            iframe.removeEventListener('load', onLoadHandle);
        };
        iframe.addEventListener('load', onLoadHandle);
    };
    DOMWatcher.prototype.findElementsByTag = function (name, updateNodeData) {
        var elements = updateNodeData.filter(function (data) {
            return data.node.tag === name;
        });
        return elements;
    };
    DOMWatcher.prototype.watchIFrames = function (addedNodes) {
        var _this = this;
        var iframeNodes = this.findElementsByTag('iframe', addedNodes);
        if (iframeNodes.length) {
            iframeNodes
                .map(function (node) { return utils_1.nodeStore.getNode(node.node.id); })
                .filter(Boolean)
                .map(function (iframeElement) { return iframeElement.contentWindow; })
                .forEach(function (context) { return _this.recorder.recordIFrame(context); });
        }
    };
    DOMWatcher.prototype.rewriteAddedSource = function (addedNodes, time) {
        var _this = this;
        var options = window.G_RECORD_OPTIONS;
        var configs = (options === null || options === void 0 ? void 0 : options.rewriteResource) || [];
        if (!(configs === null || configs === void 0 ? void 0 : configs.length)) {
            return;
        }
        var vNodes = addedNodes.map(function (item) { return item.node; }).filter(function (node) { return (0, utils_1.isVNode)(node) && node; });
        (0, common_1.rewriteNodes)(vNodes, configs, function (data) { return _this.emitData(share_1.RecordType.PATCH, data, time + 1); });
    };
    return DOMWatcher;
}(watcher_1.Watcher));
exports.DOMWatcher = DOMWatcher;

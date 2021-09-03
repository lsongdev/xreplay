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
exports.FormElementWatcher = void 0;
var utils_1 = require("@timecat/utils");
var share_1 = require("@timecat/share");
var watcher_1 = require("../watcher");
var FormElementWatcher = /** @class */ (function (_super) {
    __extends(FormElementWatcher, _super);
    function FormElementWatcher() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FormElementWatcher.prototype.init = function () {
        this.listenInputs(this.options);
        this.hijackInputs(this.options);
    };
    FormElementWatcher.prototype.listenInputs = function (options) {
        var _this = this;
        var context = options.context;
        var eventTypes;
        (function (eventTypes) {
            eventTypes["input"] = "input";
            eventTypes["change"] = "change";
            eventTypes["focus"] = "focus";
            eventTypes["blur"] = "blur";
        })(eventTypes || (eventTypes = {}));
        var eventListenerOptions = { once: false, passive: true, capture: true };
        Object.values(eventTypes)
            .map(function (type) { return function (fn) {
            context.addEventListener(type, fn, eventListenerOptions);
            _this.uninstall(function () { return context.removeEventListener(type, fn, eventListenerOptions); });
        }; })
            .forEach(function (call) { return call(handleFn.bind(_this)); });
        function handleFn(e) {
            var eventType = e.type;
            var data;
            switch (eventType) {
                case eventTypes.input:
                case eventTypes.change:
                    var target = e.target;
                    var inputType = target.getAttribute('type') || 'text';
                    var key = 'value';
                    var value = target.value || '';
                    var newValue = '';
                    var patches = [];
                    if (inputType === 'checkbox' || inputType === 'radio') {
                        if (eventType === 'input') {
                            return;
                        }
                        key = 'checked';
                        newValue = target.checked;
                    }
                    else {
                        if (value === target.oldValue) {
                            return;
                        }
                        if (value.length <= 20 || !target.oldValue) {
                            newValue = value;
                        }
                        else {
                            patches.push.apply(patches, (0, utils_1.getStrDiffPatches)(target.oldValue, value));
                        }
                        target.oldValue = value;
                    }
                    data = {
                        type: eventType === 'input' ? share_1.FormElementEvent.INPUT : share_1.FormElementEvent.CHANGE,
                        id: this.getNodeId(e.target),
                        key: key,
                        value: !patches.length ? newValue : null,
                        patches: patches
                    };
                    break;
                case eventTypes.focus:
                    data = {
                        type: share_1.FormElementEvent.FOCUS,
                        id: this.getNodeId(e.target)
                    };
                    break;
                case eventTypes.blur:
                    data = {
                        type: share_1.FormElementEvent.BLUR,
                        id: this.getNodeId(e.target)
                    };
                    break;
                default:
                    break;
            }
            this.emitData(share_1.RecordType.FORM_EL, data);
        }
    };
    FormElementWatcher.prototype.hijackInputs = function (options) {
        var _this = this;
        var context = options.context;
        var self = this;
        function handleEvent(key, value) {
            var data = {
                type: share_1.FormElementEvent.PROP,
                id: self.getNodeId(this),
                key: key,
                value: value
            };
            self.emitData(share_1.RecordType.FORM_EL, data);
        }
        var hijacking = function (key, target) {
            var original = context.Object.getOwnPropertyDescriptor(target, key);
            context.Object.defineProperty(target, key, {
                set: function (value) {
                    var _this = this;
                    setTimeout(function () {
                        handleEvent.call(_this, key, value);
                    });
                    if (original && original.set) {
                        original.set.call(this, value);
                    }
                }
            });
            _this.uninstall(function () {
                if (original) {
                    context.Object.defineProperty(target, key, original);
                }
            });
        };
        new Map([
            [context.HTMLSelectElement.prototype, 'value'],
            [context.HTMLTextAreaElement.prototype, 'value'],
            [context.HTMLOptionElement.prototype, 'selected']
        ]).forEach(hijacking.bind(this));
        new Map([
            ['value', context.HTMLInputElement.prototype],
            ['checked', context.HTMLInputElement.prototype]
        ]).forEach(function (target, key) { return hijacking(key, target); });
    };
    return FormElementWatcher;
}(watcher_1.Watcher));
exports.FormElementWatcher = FormElementWatcher;

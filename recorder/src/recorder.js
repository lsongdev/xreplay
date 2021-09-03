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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.RecorderModule = exports.Recorder = void 0;
var watchers_1 = require("./watchers");
var audio_1 = require("./audio");
var share_1 = require("@timecat/share");
var utils_1 = require("@timecat/utils");
var snapshot_1 = require("./snapshot");
var head_1 = require("./head");
var location_1 = require("./watchers/location");
var pluginable_1 = require("./pluginable");
var video_1 = require("./watchers/video");
var types_1 = require("./types");
var Recorder = /** @class */ (function () {
    function Recorder(options) {
        var _this = this;
        this.status = types_1.RecorderStatus.PAUSE;
        this.onData = utils_1.tempEmptyFn;
        this.destroy = utils_1.tempEmptyPromise;
        this.pause = utils_1.tempEmptyPromise;
        this.record = utils_1.tempEmptyPromise;
        this.use = utils_1.tempEmptyFn;
        this.clearDB = utils_1.tempEmptyPromise;
        var recorder = new RecorderModule(options);
        Object.keys(this).forEach(function (key) {
            Object.defineProperty(_this, key, {
                get: function () {
                    return typeof recorder[key] === 'function'
                        ? recorder[key].bind(recorder)
                        : recorder[key];
                }
            });
        });
    }
    return Recorder;
}());
exports.Recorder = Recorder;
var RecorderModule = /** @class */ (function (_super) {
    __extends(RecorderModule, _super);
    function RecorderModule(options) {
        var _this = _super.call(this, options) || this;
        _this.defaultMiddleware = [];
        _this.destroyStore = new Set();
        _this.listenStore = new Set();
        _this.middleware = __spreadArray([], _this.defaultMiddleware, true);
        _this.watchersInstance = new Map();
        _this.watchesReadyPromise = new Promise(function (resolve) { return (_this.watcherResolve = resolve); });
        _this.status = types_1.RecorderStatus.PAUSE;
        var opts = _this.initOptions(options);
        opts.rootContext = opts.rootContext || opts.context;
        _this.options = opts;
        _this.watchers = _this.getWatchers();
        _this.init();
        return _this;
    }
    RecorderModule.prototype.initOptions = function (options) {
        var opts = __assign(__assign({}, RecorderModule.defaultRecordOpts), options);
        if (opts.video === true) {
            opts.video = { fps: 24 };
        }
        else if (opts.video && 'fps' in opts.video) {
            if (opts.video.fps > 24) {
                opts.video.fps = 24;
            }
        }
        return opts;
    };
    RecorderModule.prototype.init = function () {
        this.startTime = (0, utils_1.getTime)();
        var options = this.options;
        this.db = utils_1.idb;
        this.loadPlugins();
        this.hooks.beforeRun.call(this);
        this.record(options);
        this.hooks.run.call(this);
    };
    RecorderModule.prototype.onData = function (fn) {
        this.middleware.unshift(fn);
    };
    RecorderModule.prototype.destroy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ret;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.status === types_1.RecorderStatus.HALT) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.pause()];
                    case 1:
                        ret = _a.sent();
                        if (ret) {
                            this.status = types_1.RecorderStatus.HALT;
                            this.destroyTime = ret.lastTime || (0, utils_1.getTime)();
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    RecorderModule.prototype.pause = function () {
        return __awaiter(this, void 0, void 0, function () {
            var last, lastTime, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.status === types_1.RecorderStatus.RUNNING)) return [3 /*break*/, 3];
                        this.status = types_1.RecorderStatus.PAUSE;
                        return [4 /*yield*/, this.db.last()["catch"](function () { })];
                    case 1:
                        last = _a.sent();
                        return [4 /*yield*/, this.cancelListener()];
                    case 2:
                        _a.sent();
                        this.destroyStore.forEach(function (un) { return un(); });
                        this.destroyStore.clear();
                        lastTime = null;
                        if (last) {
                            lastTime = last.time + 1;
                            data = {
                                type: share_1.RecordType.TERMINATE,
                                data: null,
                                relatedId: window.G_RECORD_RELATED_ID,
                                time: lastTime
                            };
                            if (data.relatedId) {
                                if (this.options.write) {
                                    this.db.add(data);
                                }
                                this.connectCompose(this.middleware)(data);
                            }
                        }
                        return [2 /*return*/, { lastTime: lastTime }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RecorderModule.prototype.clearDB = function () {
        this.db.clear();
    };
    RecorderModule.prototype.cancelListener = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // wait for watchers loaded
                    return [4 /*yield*/, this.watchesReadyPromise];
                    case 1:
                        // wait for watchers loaded
                        _a.sent();
                        this.listenStore.forEach(function (un) { return un(); });
                        this.listenStore.clear();
                        utils_1.nodeStore.reset();
                        return [2 /*return*/];
                }
            });
        });
    };
    RecorderModule.prototype.getWatchers = function () {
        var _a = this.options, video = _a.video, audio = _a.audio, disableWatchers = _a.disableWatchers;
        var watchersList = __spreadArray([snapshot_1.Snapshot], Object.values(watchers_1.watchers), true);
        if (audio) {
            watchersList.push(audio_1.AudioWatcher);
        }
        if (video) {
            watchersList.push(video_1.VideoWatcher);
        }
        return watchersList.filter(function (watcher) {
            return !~disableWatchers.indexOf(watcher.name);
        });
    };
    RecorderModule.prototype.record = function (options) {
        if (this.status === types_1.RecorderStatus.PAUSE) {
            var opts = __assign(__assign({}, RecorderModule.defaultRecordOpts), options);
            this.startRecord((opts.context.G_RECORD_OPTIONS = opts));
            return;
        }
    };
    RecorderModule.prototype.startRecord = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var activeWatchers, isSameCtx, onEmit, isInRoot, emit, headData, relatedId, locationInstance;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.status = types_1.RecorderStatus.RUNNING;
                        activeWatchers = __spreadArray(__spreadArray([], this.watchers, true), this.pluginWatchers, true);
                        isSameCtx = options.context === this.options.rootContext;
                        if (isSameCtx) {
                            if (!options.keep) {
                                this.db.clear();
                            }
                        }
                        else {
                            // for iframe watchers
                            activeWatchers = __spreadArray([snapshot_1.Snapshot], Object.values(watchers_1.baseWatchers), true);
                        }
                        onEmit = function (options) {
                            var write = options.write;
                            var emitTasks = [];
                            var rootMiddleware = (_this.options.rootRecorder || { middleware: [] }).middleware;
                            var execTasksChain = (function () {
                                var concurrency = 0;
                                var MAX_CONCURRENCY = 1;
                                return function () { return __awaiter(_this, void 0, void 0, function () {
                                    var record, middleware;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (concurrency >= MAX_CONCURRENCY) {
                                                    return [2 /*return*/];
                                                }
                                                concurrency++;
                                                _a.label = 1;
                                            case 1:
                                                if (!emitTasks.length) return [3 /*break*/, 5];
                                                record = emitTasks.shift();
                                                return [4 /*yield*/, (0, utils_1.delay)(0)];
                                            case 2:
                                                _a.sent();
                                                if (!(this.status === types_1.RecorderStatus.RUNNING)) return [3 /*break*/, 4];
                                                if (write) {
                                                    this.db.add(record);
                                                }
                                                middleware = __spreadArray(__spreadArray([], rootMiddleware, true), this.middleware, true);
                                                return [4 /*yield*/, this.connectCompose(middleware)(record)];
                                            case 3:
                                                _a.sent();
                                                this.hooks.emit.call(record);
                                                _a.label = 4;
                                            case 4: return [3 /*break*/, 1];
                                            case 5:
                                                concurrency--;
                                                return [2 /*return*/];
                                        }
                                    });
                                }); };
                            })();
                            return function (data) {
                                if (!data) {
                                    return;
                                }
                                emitTasks.push(data);
                                execTasksChain();
                            };
                        };
                        isInRoot = options.context === this.options.rootContext;
                        emit = onEmit(options);
                        headData = (0, head_1.getHeadData)();
                        relatedId = isInRoot ? headData.relatedId : options.rootContext.G_RECORD_RELATED_ID;
                        options.context.G_RECORD_RELATED_ID = relatedId;
                        if (isInRoot) {
                            emit({
                                type: share_1.RecordType.HEAD,
                                data: headData,
                                relatedId: relatedId,
                                time: (0, utils_1.getTime)()
                            });
                        }
                        activeWatchers.forEach(function (Watcher) {
                            try {
                                var watcher = new Watcher({
                                    recorder: _this,
                                    context: options && options.context,
                                    listenStore: _this.listenStore,
                                    relatedId: relatedId,
                                    emit: emit,
                                    watchers: _this.watchersInstance
                                });
                                _this.watchersInstance.set(Watcher.name, watcher);
                            }
                            catch (e) {
                                (0, utils_1.logError)(e);
                            }
                        });
                        if (isInRoot && options.emitLocationImmediate) {
                            locationInstance = this.watchersInstance.get(location_1.LocationWatcher.name);
                            locationInstance === null || locationInstance === void 0 ? void 0 : locationInstance.emitOne();
                        }
                        this.watcherResolve();
                        return [4 /*yield*/, this.recordSubIFrames(options.context)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RecorderModule.prototype.waitingSubIFramesLoaded = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var frames, validFrames;
            var _this = this;
            return __generator(this, function (_a) {
                frames = context.frames;
                validFrames = Array.from(frames)
                    .filter(function (frame) {
                    try {
                        return frame.frameElement && frame.frameElement.getAttribute('src');
                    }
                    catch (e) {
                        (0, utils_1.logError)(e);
                        return false;
                    }
                })
                    .map(function (frame) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, (0, utils_1.delay)(0)];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, new Promise(function (resolve) {
                                        if (frame.document.readyState === 'complete') {
                                            resolve(frame);
                                        }
                                        else {
                                            frame.addEventListener('load', function () {
                                                resolve(frame);
                                            });
                                        }
                                    })];
                            case 2: return [2 /*return*/, _a.sent()];
                        }
                    });
                }); });
                if (!validFrames.length) {
                    return [2 /*return*/, Promise.resolve([])];
                }
                return [2 /*return*/, Promise.all(validFrames)];
            });
        });
    };
    RecorderModule.prototype.waitingIFrameLoaded = function (frame) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    frame.document && frame.frameElement && frame.frameElement.getAttribute('src');
                }
                catch (e) {
                    (0, utils_1.logError)(e);
                    return [2 /*return*/];
                }
                return [2 /*return*/, new Promise(function (resolve) {
                        var timer = window.setInterval(function () {
                            try {
                                if (frame.document) {
                                    clearInterval(timer);
                                    resolve(frame);
                                }
                            }
                            catch (e) {
                                (0, utils_1.logError)(e);
                                clearInterval(timer);
                                resolve(undefined);
                            }
                        }, 200);
                    })];
            });
        });
    };
    RecorderModule.prototype.recordSubIFrames = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var frames;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.waitingSubIFramesLoaded(context)];
                    case 1:
                        frames = _a.sent();
                        frames.forEach(function (frameWindow) {
                            _this.createIFrameRecorder(frameWindow);
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    RecorderModule.prototype.recordIFrame = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var frameWindow;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.waitingIFrameLoaded(context)];
                    case 1:
                        frameWindow = _a.sent();
                        if (frameWindow) {
                            this.createIFrameRecorder(frameWindow);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    RecorderModule.prototype.createIFrameRecorder = function (frameWindow) {
        var frameRecorder = new RecorderModule(__assign(__assign({}, this.options), { context: frameWindow, keep: true, rootRecorder: this.options.rootRecorder || this, rootContext: this.options.rootContext }));
        var frameElement = frameWindow.frameElement;
        frameElement.frameRecorder = frameRecorder;
        this.destroyStore.add(function () { return frameRecorder.destroy(); });
    };
    RecorderModule.prototype.connectCompose = function (list) {
        var _this = this;
        return function (data) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, list.reduce(function (next, fn) {
                            return _this.createNext(fn, data, next);
                        }, function () { return Promise.resolve(); })()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); };
    };
    RecorderModule.prototype.createNext = function (fn, data, next) {
        var _this = this;
        return function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fn(data, next)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        }); }); };
    };
    RecorderModule.defaultRecordOpts = {
        mode: 'default',
        write: true,
        keep: false,
        audio: false,
        video: false,
        emitLocationImmediate: true,
        context: window,
        rewriteResource: [],
        disableWatchers: []
    };
    return RecorderModule;
}(pluginable_1.Pluginable));
exports.RecorderModule = RecorderModule;

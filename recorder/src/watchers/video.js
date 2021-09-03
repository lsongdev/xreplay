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
exports.__esModule = true;
exports.VideoWatcher = void 0;
var share_1 = require("@timecat/share");
var utils_1 = require("@timecat/utils");
var watcher_1 = require("../watcher");
var VideoWatcher = /** @class */ (function (_super) {
    __extends(VideoWatcher, _super);
    function VideoWatcher() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VideoWatcher.prototype.init = function () {
        var recordOptions = this.recordOptions;
        var video = recordOptions.video;
        this.fps = video.fps;
        this.watchVideos();
    };
    VideoWatcher.prototype.watchVideos = function () {
        var _this = this;
        var videoElements = document.getElementsByTagName('video');
        Array.from(videoElements).forEach(function (videoElement) {
            _this.recordVideo(videoElement);
        });
    };
    VideoWatcher.prototype.recordVideo = function (videoElement) {
        var _this = this;
        var canvas = this.createMirrorCanvas(videoElement);
        var ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        var resizeHandle = function () {
            _this.resizeCanvasSize(canvas, videoElement);
        };
        videoElement.addEventListener('resize', resizeHandle);
        function drawCanvas(videoElement, ctx) {
            var canvas = ctx.canvas;
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        }
        drawCanvas(videoElement, ctx);
        var recorder = new MediaRecorder(canvas.captureStream(60), {
            mimeType: 'video/webm;codecs=vp9',
            bitsPerSecond: 1000000
        });
        recorder.ondataavailable = function (e) { return __awaiter(_this, void 0, void 0, function () {
            var blob, buffer, dataStr, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        blob = e.data;
                        return [4 /*yield*/, blob.arrayBuffer()];
                    case 1:
                        buffer = _a.sent();
                        dataStr = (0, utils_1.bufferArrayToBase64)(buffer);
                        data = {
                            id: utils_1.nodeStore.getNodeId(videoElement),
                            dataStr: dataStr
                        };
                        this.emitData(share_1.RecordType.VIDEO, data);
                        return [2 /*return*/];
                }
            });
        }); };
        var stopRecord = function () {
            recorder.state === 'recording' && recorder.stop();
        };
        var isRecording = false;
        var drawRAF = new utils_1.AnimationFrame(function () { return drawCanvas(videoElement, ctx); }, this.fps);
        var triggerDraw = (0, utils_1.debounce)(function () {
            isRecording = !isRecording;
            if (isRecording) {
                drawRAF.start();
                recorder.start(1000 / _this.fps);
            }
            else {
                drawRAF.stop();
                stopRecord();
            }
        }, 300, { isTrailing: true, isImmediate: true });
        videoElement.addEventListener('timeupdate', triggerDraw);
        this.uninstall(function () {
            stopRecord();
            videoElement.removeEventListener('timeupdate', triggerDraw);
            videoElement.removeEventListener('resize', resizeHandle);
        });
    };
    VideoWatcher.prototype.createMirrorCanvas = function (videoElement) {
        var canvas = document.createElement('canvas', false);
        this.resizeCanvasSize(canvas, videoElement);
        return canvas;
    };
    VideoWatcher.prototype.resizeCanvasSize = function (canvas, el) {
        var _a = el.getBoundingClientRect(), width = _a.width, height = _a.height;
        canvas.width = width;
        canvas.height = height;
    };
    return VideoWatcher;
}(watcher_1.Watcher));
exports.VideoWatcher = VideoWatcher;

"use strict";
/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
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
exports.rewriteNodes = void 0;
var utils_1 = require("@timecat/utils");
// https://github.com/gnuns/allorigins
// Pull contents from any page and avoid Same-origin policy problems
var defaultCrossUrl = 'https://timecatjs.com/all-origins?url=';
function rewriteNodes(vNodes, configs, preFetchCallback) {
    var _this = this;
    if (!configs) {
        return;
    }
    var _a = configs.reduce(function (collect, config) {
        if (config.type === 'preFetch') {
            collect.preFetchConfigs.push(config);
        }
        else {
            collect.rewriteConfigs.push(config);
        }
        return collect;
    }, { rewriteConfigs: [], preFetchConfigs: [] }), rewriteConfigs = _a.rewriteConfigs, preFetchConfigs = _a.preFetchConfigs;
    if (rewriteConfigs.some(function (config) {
        var matches = config.matches, rewrite = config.rewrite;
        var replaceOrigin = rewrite.replaceOrigin;
        return !replaceOrigin || !matches;
    })) {
        return (0, utils_1.logError)('The params replaceOrigin and matches is required for using rewriteResource');
    }
    function matchNodeSource(node, matches) {
        return function (func) {
            var _a = node.attrs, href = _a.href, src = _a.src;
            Object.entries({ href: href, src: src })
                .filter(function (_a) {
                var source = _a[1];
                if (!source) {
                    return;
                }
                return matches.some(function (item) {
                    if (typeof item === 'string') {
                        return source.endsWith('.' + item);
                    }
                    return item.test(source);
                });
            })
                .forEach(function (item) { return func.apply(void 0, __spreadArray([node], item, false)); });
        };
    }
    rewriteConfigs.forEach(function (config) {
        var rewrite = config.rewrite, matches = config.matches;
        var replaceOrigin = rewrite.replaceOrigin, folderPath = rewrite.folderPath, fn = rewrite.fn;
        var base = document.getElementsByTagName('base')[0];
        var href = window.location.href;
        var rewriteNode = function (node) { return matchNodeSource(node, matches)(rewriteAttr); };
        var rewriteAttr = function (vNode, key, source) {
            var target = vNode.attrs;
            var url = (0, utils_1.createURL)(source, (base === null || base === void 0 ? void 0 : base.href) || href);
            var oldUrl = url.href;
            var nextUrl = pathJoin(replaceOrigin, folderPath || '', url.pathname);
            var targetUrl = (fn && fn(oldUrl, nextUrl)) || nextUrl;
            target[key] = targetUrl;
        };
        vNodes.forEach(rewriteNode);
    });
    preFetchConfigs.forEach(function (config) {
        var rewrite = config.rewrite, matches = config.matches;
        var strMatches = matches.filter(function (m) { return typeof m === 'string'; });
        if (!strMatches.every(function (s) { return s.endsWith('css'); })) {
            return (0, utils_1.logError)('PreFetch Resource only support [css] currently');
        }
        var replaceOrigin = rewrite.replaceOrigin, folderPath = rewrite.folderPath, crossUrl = rewrite.crossUrl, fn = rewrite.fn, subMatches = rewrite.matches;
        var base = document.getElementsByTagName('base')[0];
        var href = window.location.href;
        var rewriteNode = function (node) { return matchNodeSource(node, matches)(preFetchSource); };
        var preFetchSource = function (vNode, key, source) { return __awaiter(_this, void 0, void 0, function () {
            var url, resText, text, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = (0, utils_1.createURL)(source, (base === null || base === void 0 ? void 0 : base.href) || href);
                        return [4 /*yield*/, fetch(url.href)
                                .then(function (res) { return res.text(); }, function () { return ''; })["catch"](function (err) { return (0, utils_1.logWarn)(err); })];
                    case 1:
                        resText = _a.sent();
                        if (!resText) {
                            return [2 /*return*/];
                        }
                        text = (0, utils_1.completeCssHref)(resText, url.href, function (preUrl) {
                            if (!subMatches) {
                                return preUrl;
                            }
                            var nextUrl;
                            var url = (0, utils_1.createURL)(preUrl, (base === null || base === void 0 ? void 0 : base.href) || href);
                            var anyMatched = subMatches.some(function (item) {
                                if (typeof item === 'string') {
                                    return url.pathname.endsWith('.' + item);
                                }
                                return item.test(preUrl);
                            });
                            if (!anyMatched) {
                                return preUrl;
                            }
                            if (replaceOrigin && folderPath) {
                                nextUrl = pathJoin(replaceOrigin, folderPath || '', url.pathname);
                            }
                            else {
                                nextUrl = getCrossOriginUrl(preUrl, crossUrl);
                            }
                            return (fn && fn(preUrl, nextUrl)) || nextUrl;
                        });
                        data = {
                            id: vNode.id,
                            tag: vNode.tag,
                            key: key,
                            time: (0, utils_1.getTime)(),
                            url: url.href,
                            text: text
                        };
                        preFetchCallback(data);
                        return [2 /*return*/];
                }
            });
        }); };
        vNodes.forEach(rewriteNode);
    });
}
exports.rewriteNodes = rewriteNodes;
function pathJoin() {
    var urls = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        urls[_i] = arguments[_i];
    }
    if (!urls.length) {
        return '';
    }
    if (urls.length === 1) {
        return urls[0];
    }
    function pureEnd(path) {
        return path.endsWith('/') ? path.substring(0, path.length - 1) : path;
    }
    function pureStart(path) {
        return path.startsWith('/') ? path.substring(1) : path;
    }
    return urls.reduce(function (url, path) {
        if (!url) {
            if (!path.startsWith('http')) {
                throw new Error('path error');
            }
            return pureEnd(path);
        }
        return url + (path ? '/' + pureStart(pureEnd(path)) : '');
    }, '');
}
function getCrossOriginUrl(preUrl, crossUrl) {
    var encodeUrl = encodeURIComponent(preUrl);
    var nextUrl;
    if (crossUrl && typeof crossUrl === 'string') {
        if (~crossUrl.indexOf('<$url>')) {
            nextUrl = crossUrl.replace('<$url>', encodeUrl);
        }
        else {
            nextUrl = crossUrl + encodeUrl;
        }
    }
    else {
        nextUrl = defaultCrossUrl + encodeUrl;
    }
    return nextUrl;
}

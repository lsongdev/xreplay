/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

class NodeStore {
    constructor() {
        this.createNodeId = () => NodeStore.nodeId++;
        this.init();
    }
    init() {
        this.nodeMap = new Map();
        this.idMap = new WeakMap();
    }
    reset() {
        this.nodeMap.clear();
    }
    getNode(id) {
        return this.nodeMap.get(id) || null;
    }
    addNode(node, id = this.createNodeId()) {
        this.idMap.set(node, id);
        this.nodeMap.set(id, node);
        return id;
    }
    removeNode(id) {
        this.nodeMap.delete(id);
        this.idMap.delete(this.getNode(id));
    }
    getNodeId(node) {
        return this.idMap.get(node);
    }
    updateNode(id, node) {
        this.idMap.set(node, id);
        this.nodeMap.set(id, node);
    }
}
NodeStore.nodeId = 1;
const nodeStore = new NodeStore();

var RecordType;
(function (RecordType) {
    RecordType[RecordType["HEAD"] = 0] = "HEAD";
    RecordType[RecordType["SNAPSHOT"] = 1] = "SNAPSHOT";
    RecordType[RecordType["WINDOW"] = 2] = "WINDOW";
    RecordType[RecordType["SCROLL"] = 3] = "SCROLL";
    RecordType[RecordType["MOUSE"] = 4] = "MOUSE";
    RecordType[RecordType["DOM"] = 5] = "DOM";
    RecordType[RecordType["FORM_EL"] = 6] = "FORM_EL";
    RecordType[RecordType["LOCATION"] = 7] = "LOCATION";
    RecordType[RecordType["AUDIO"] = 8] = "AUDIO";
    RecordType[RecordType["CANVAS"] = 9] = "CANVAS";
    RecordType[RecordType["TERMINATE"] = 10] = "TERMINATE";
    RecordType[RecordType["FONT"] = 11] = "FONT";
    RecordType[RecordType["PATCH"] = 12] = "PATCH";
    RecordType[RecordType["CUSTOM"] = 13] = "CUSTOM";
    RecordType[RecordType["WEBGL"] = 14] = "WEBGL";
    RecordType[RecordType["CANVAS_SNAPSHOT"] = 15] = "CANVAS_SNAPSHOT";
    RecordType[RecordType["VIDEO"] = 16] = "VIDEO";
})(RecordType || (RecordType = {}));
var FormElementEvent;
(function (FormElementEvent) {
    FormElementEvent[FormElementEvent["PROP"] = 0] = "PROP";
    FormElementEvent[FormElementEvent["INPUT"] = 1] = "INPUT";
    FormElementEvent[FormElementEvent["CHANGE"] = 2] = "CHANGE";
    FormElementEvent[FormElementEvent["FOCUS"] = 3] = "FOCUS";
    FormElementEvent[FormElementEvent["BLUR"] = 4] = "BLUR";
})(FormElementEvent || (FormElementEvent = {}));
var MouseEventType;
(function (MouseEventType) {
    MouseEventType[MouseEventType["MOVE"] = 0] = "MOVE";
    MouseEventType[MouseEventType["CLICK"] = 1] = "CLICK";
})(MouseEventType || (MouseEventType = {}));
var TransactionMode;
(function (TransactionMode) {
    TransactionMode["READONLY"] = "readonly";
    TransactionMode["READWRITE"] = "readwrite";
    TransactionMode["VERSIONCHANGE"] = "versionchange";
})(TransactionMode || (TransactionMode = {}));

var name = "xreplay";
var version = "0.0.3";
var homepage = "https://github.com/song940/xreplay#readme";

function logError(e) {
    const msg = e.message || e;
    console.error(`TimeCat Error: ${msg}`);
    return msg;
}
function logAdvice(msg) {
    console.log(`%c TimeCat Advice: ${msg}`, 'color:#0f0;');
    return msg;
}
function getTime() {
    return Date.now();
}
function secondToTime(second) {
    if (second <= 0) {
        second = 0;
    }
    const [h, m, s] = [Math.floor(second / 3600), Math.floor((second / 60) % 60), Math.floor(second % 60)];
    const timeStr = [h, m, s].map(i => (i <= 9 ? '0' + i : i)).join(':');
    return timeStr.replace(/^00\:/, '');
}
function getDateTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = '0' + date.getMinutes();
    const seconds = '0' + date.getSeconds();
    const formattedTime = (hours < 10 ? '0' + hours : hours) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    return formattedTime;
}
function toTimeStamp(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        const [min, sec] = parts;
        return (+min * 60 + +sec) * 1000;
    }
    const [hour, min, sec] = parts;
    return (+hour * 3600 + +min * 60 + +sec) * 1000;
}
function isSnapshot(frame) {
    return frame.type === RecordType.SNAPSHOT && !frame.data.frameId;
}
function delay(t = 200) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(r => {
            setTimeout(() => r(), t);
        });
    });
}
function isVNode(n) {
    return !!n.tag;
}
function revertStrByPatches(str, changes) {
    changes.forEach((change) => {
        const { type, value, len } = change;
        switch (type) {
            case 'add':
                str = str.substring(0, change.index) + value + str.substring(change.index);
                break;
            case 'rm':
                str = str.substring(0, change.index) + str.substring(change.index + len);
                break;
        }
    });
    return str;
}
function debounce(func, waitMilliseconds, options = {
    isImmediate: false,
    isTrailing: false
}) {
    let timeoutId;
    return function (...args) {
        const context = this;
        const doLater = function () {
            timeoutId = undefined;
            if (!options.isImmediate || options.isTrailing) {
                func.apply(context, args);
            }
        };
        const shouldCallNow = options.isImmediate && timeoutId === undefined;
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(doLater, waitMilliseconds);
        if (shouldCallNow) {
            func.apply(context, args);
        }
    };
}
function createURL(url, base) {
    try {
        return new URL(url, base);
    }
    catch (e) {
        logError(e);
    }
    return { href: url, pathname: url };
}
function stateDebounce(stateHandle, delay, initState) {
    let preState = initState;
    let timer = 0;
    return (cb) => {
        stateHandle(delayExec);
        function delayExec(state) {
            if (timer) {
                clearTimeout(timer);
            }
            timer = window.setTimeout(() => {
                if (preState === state) {
                    return;
                }
                cb(state);
                preState = state;
                clearTimeout(timer);
                timer = 0;
            }, typeof delay === 'number' ? delay : delay(state));
        }
    };
}
function logBadge(opts) {
    const { title, content, titleColor, backgroundColor } = opts;
    const tColor = titleColor || '#606060';
    const bColor = backgroundColor || '#1475b2';
    const args = [
        '%c '.concat(title, ' %c ').concat(content, ' '),
        'padding: 1px; border-radius: 3px 0 0 3px; color: #fff; background: '.concat(tColor, ';'),
        'padding: 1px; border-radius: 0 3px 3px 0; color: #fff; background: '.concat(bColor, ';')
    ];
    console.log.apply(void 0, args);
}
function logInfo() {
    logBadge({ title: name, content: version });
    logBadge({ title: 'homepage', content: homepage });
}
function removeGlobalVariables() {
    const keys = Object.keys(window);
    const targetKeys = keys.filter(key => {
        if (key) {
            if (key.startsWith('G_RECORD') || key.startsWith('G_REPLAY')) {
                return true;
            }
        }
    });
    targetKeys.forEach(key => {
        delete window[key];
    });
}
const tempEmptyFn = () => { };

const snapshot = () => window.G_REPLAY_DATA && window.G_REPLAY_DATA.snapshot.data;
const href = () => { var _a; return ((_a = snapshot()) === null || _a === void 0 ? void 0 : _a.href) || location.href; };
function isElementNode(node) {
    return node.nodeType === Node.ELEMENT_NODE;
}
function completeCssHref(str, baseUrl, setHref) {
    return str.replace(/(url\(['"]?((\/{1,2}|\.\.?\/)?.*?)(^\?.*?)?['"]?(?=\)))/g, (string, b, url) => {
        const newUrl = createURL(url, baseUrl || href());
        if (url.startsWith('data:')) {
            return string;
        }
        return string.replace(url, setHref ? setHref(newUrl.href) : newUrl.href);
    });
}
function completeAttrHref(str, node) {
    if (str.startsWith('data')) {
        return str;
    }
    if (node) {
        setTimeout(() => {
            const doc = node.getRootNode();
            const context = doc.defaultView;
            const { href, path } = (context === null || context === void 0 ? void 0 : context.G_REPLAY_LOCATION) || {};
            if (path && href) {
                const relationHref = createURL(path, href).href;
                const attrs = node.getAttributeNames();
                attrs
                    .filter(key => ~['src', 'href'].indexOf(key))
                    .forEach(key => {
                    const newHref = createURL(str, relationHref).href;
                    if (node.getAttribute(key) !== newHref) {
                        node.setAttribute(key, newHref);
                    }
                });
            }
        });
    }
    return createURL(str, href()).href;
}
function isHideComment(node) {
    if (!node) {
        return false;
    }
    return node.nodeType === Node.COMMENT_NODE && node.textContent === 'hidden';
}
function isExistingNode(node) {
    return node.ownerDocument && !!node.ownerDocument.contains(node);
}

function encodePCM(bufferData, opts) {
    const { sampleBits } = opts;
    const isLittleEndian = true;
    const length = bufferData.length * (sampleBits / 8);
    const data = new DataView(new ArrayBuffer(length));
    let offset = 0;
    if (sampleBits === 8) {
        for (let i = 0; i < bufferData.length; i++, offset++) {
            const s = Math.max(-1, Math.min(1, bufferData[i]));
            let val = s < 0 ? s * 128 : s * 127;
            val = +val + 128;
            data.setInt8(offset, val);
        }
    }
    else {
        for (let i = 0; i < bufferData.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, bufferData[i]));
            data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, isLittleEndian);
        }
    }
    return data;
}
function encodeWAV(data, opts) {
    const dataView = encodeAudioData(data, opts);
    const blob = new Blob([dataView], {
        type: 'audio/wav'
    });
    return blob;
}
function encodeAudioData(data, opts) {
    const PMC = encodePCM(mergeArray(data), opts);
    return createWavFile(PMC, opts);
}
function mergeArray(list) {
    const length = list.length * list[0].length;
    const data = new Float32Array(length);
    let offset = 0;
    for (let i = 0; i < list.length; i++) {
        data.set(list[i], offset);
        offset += list[i].length;
    }
    return data;
}
function createWavFile(audioData, { channelCount, sampleBits, sampleRate }) {
    const WAV_HEAD_SIZE = 44;
    const buffer = new ArrayBuffer(WAV_HEAD_SIZE + audioData.byteLength);
    const isLittleEndian = true;
    const view = new DataView(buffer);
    writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, 36 + audioData.byteLength * 2, isLittleEndian);
    writeUTFBytes(view, 8, 'WAVE');
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, isLittleEndian);
    view.setUint16(20, 1, isLittleEndian);
    view.setUint16(22, channelCount, isLittleEndian);
    view.setUint32(24, sampleRate, isLittleEndian);
    view.setUint32(28, sampleRate * channelCount * (sampleBits / 8), isLittleEndian);
    view.setUint16(32, channelCount * (sampleBits / 8), isLittleEndian);
    view.setUint16(34, sampleBits, isLittleEndian);
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, audioData.byteLength, isLittleEndian);
    const length = audioData.byteLength;
    let offset = 44;
    for (let i = 0; i < length; i++) {
        view.setUint8(offset, audioData.getUint8(i));
        offset++;
    }
    return view;
}
function writeUTFBytes(view, offset, string) {
    const len = string.length;
    for (let i = 0; i < len; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
function base64ToFloat32Array(str) {
    return new Float32Array(base64ToBufferArray(str));
}
function base64ToBufferArray(str) {
    const blob = atob(str);
    const bLength = blob.length;
    const arrayBuffer = new ArrayBuffer(bLength);
    const dataView = new DataView(arrayBuffer);
    for (let i = 0; i < bLength; i++) {
        dataView.setUint8(i, blob.charCodeAt(i));
    }
    return arrayBuffer;
}

class AnimationFrame {
    constructor(animate, fps = 60) {
        this.index = 0;
        this.fps = fps;
        this.animate = animate;
    }
    start() {
        let then = performance.now();
        const interval = 1000 / this.fps;
        const tolerance = 0.1;
        const animateLoop = (now) => {
            this.requestID = requestAnimationFrame(animateLoop);
            const delta = now - then;
            if (delta >= interval - tolerance) {
                then = now - (delta % interval);
                this.animate(delta, this.index++);
            }
        };
        this.requestID = requestAnimationFrame(animateLoop);
    }
    stop() {
        cancelAnimationFrame(this.requestID);
    }
}

var smoothscroll = {exports: {}};

/* smoothscroll v0.4.4 - 2019 - Dustan Kasten, Jeremias Menichelli - MIT License */

(function (module, exports) {
(function () {

  // polyfill
  function polyfill() {
    // aliases
    var w = window;
    var d = document;

    // return if scroll behavior is supported and polyfill is not forced
    if (
      'scrollBehavior' in d.documentElement.style &&
      w.__forceSmoothScrollPolyfill__ !== true
    ) {
      return;
    }

    // globals
    var Element = w.HTMLElement || w.Element;
    var SCROLL_TIME = 468;

    // object gathering original scroll methods
    var original = {
      scroll: w.scroll || w.scrollTo,
      scrollBy: w.scrollBy,
      elementScroll: Element.prototype.scroll || scrollElement,
      scrollIntoView: Element.prototype.scrollIntoView
    };

    // define timing method
    var now =
      w.performance && w.performance.now
        ? w.performance.now.bind(w.performance)
        : Date.now;

    /**
     * indicates if a the current browser is made by Microsoft
     * @method isMicrosoftBrowser
     * @param {String} userAgent
     * @returns {Boolean}
     */
    function isMicrosoftBrowser(userAgent) {
      var userAgentPatterns = ['MSIE ', 'Trident/', 'Edge/'];

      return new RegExp(userAgentPatterns.join('|')).test(userAgent);
    }

    /*
     * IE has rounding bug rounding down clientHeight and clientWidth and
     * rounding up scrollHeight and scrollWidth causing false positives
     * on hasScrollableSpace
     */
    var ROUNDING_TOLERANCE = isMicrosoftBrowser(w.navigator.userAgent) ? 1 : 0;

    /**
     * changes scroll position inside an element
     * @method scrollElement
     * @param {Number} x
     * @param {Number} y
     * @returns {undefined}
     */
    function scrollElement(x, y) {
      this.scrollLeft = x;
      this.scrollTop = y;
    }

    /**
     * returns result of applying ease math function to a number
     * @method ease
     * @param {Number} k
     * @returns {Number}
     */
    function ease(k) {
      return 0.5 * (1 - Math.cos(Math.PI * k));
    }

    /**
     * indicates if a smooth behavior should be applied
     * @method shouldBailOut
     * @param {Number|Object} firstArg
     * @returns {Boolean}
     */
    function shouldBailOut(firstArg) {
      if (
        firstArg === null ||
        typeof firstArg !== 'object' ||
        firstArg.behavior === undefined ||
        firstArg.behavior === 'auto' ||
        firstArg.behavior === 'instant'
      ) {
        // first argument is not an object/null
        // or behavior is auto, instant or undefined
        return true;
      }

      if (typeof firstArg === 'object' && firstArg.behavior === 'smooth') {
        // first argument is an object and behavior is smooth
        return false;
      }

      // throw error when behavior is not supported
      throw new TypeError(
        'behavior member of ScrollOptions ' +
          firstArg.behavior +
          ' is not a valid value for enumeration ScrollBehavior.'
      );
    }

    /**
     * indicates if an element has scrollable space in the provided axis
     * @method hasScrollableSpace
     * @param {Node} el
     * @param {String} axis
     * @returns {Boolean}
     */
    function hasScrollableSpace(el, axis) {
      if (axis === 'Y') {
        return el.clientHeight + ROUNDING_TOLERANCE < el.scrollHeight;
      }

      if (axis === 'X') {
        return el.clientWidth + ROUNDING_TOLERANCE < el.scrollWidth;
      }
    }

    /**
     * indicates if an element has a scrollable overflow property in the axis
     * @method canOverflow
     * @param {Node} el
     * @param {String} axis
     * @returns {Boolean}
     */
    function canOverflow(el, axis) {
      var overflowValue = w.getComputedStyle(el, null)['overflow' + axis];

      return overflowValue === 'auto' || overflowValue === 'scroll';
    }

    /**
     * indicates if an element can be scrolled in either axis
     * @method isScrollable
     * @param {Node} el
     * @param {String} axis
     * @returns {Boolean}
     */
    function isScrollable(el) {
      var isScrollableY = hasScrollableSpace(el, 'Y') && canOverflow(el, 'Y');
      var isScrollableX = hasScrollableSpace(el, 'X') && canOverflow(el, 'X');

      return isScrollableY || isScrollableX;
    }

    /**
     * finds scrollable parent of an element
     * @method findScrollableParent
     * @param {Node} el
     * @returns {Node} el
     */
    function findScrollableParent(el) {
      while (el !== d.body && isScrollable(el) === false) {
        el = el.parentNode || el.host;
      }

      return el;
    }

    /**
     * self invoked function that, given a context, steps through scrolling
     * @method step
     * @param {Object} context
     * @returns {undefined}
     */
    function step(context) {
      var time = now();
      var value;
      var currentX;
      var currentY;
      var elapsed = (time - context.startTime) / SCROLL_TIME;

      // avoid elapsed times higher than one
      elapsed = elapsed > 1 ? 1 : elapsed;

      // apply easing to elapsed time
      value = ease(elapsed);

      currentX = context.startX + (context.x - context.startX) * value;
      currentY = context.startY + (context.y - context.startY) * value;

      context.method.call(context.scrollable, currentX, currentY);

      // scroll more if we have not reached our destination
      if (currentX !== context.x || currentY !== context.y) {
        w.requestAnimationFrame(step.bind(w, context));
      }
    }

    /**
     * scrolls window or element with a smooth behavior
     * @method smoothScroll
     * @param {Object|Node} el
     * @param {Number} x
     * @param {Number} y
     * @returns {undefined}
     */
    function smoothScroll(el, x, y) {
      var scrollable;
      var startX;
      var startY;
      var method;
      var startTime = now();

      // define scroll context
      if (el === d.body) {
        scrollable = w;
        startX = w.scrollX || w.pageXOffset;
        startY = w.scrollY || w.pageYOffset;
        method = original.scroll;
      } else {
        scrollable = el;
        startX = el.scrollLeft;
        startY = el.scrollTop;
        method = scrollElement;
      }

      // scroll looping over a frame
      step({
        scrollable: scrollable,
        method: method,
        startTime: startTime,
        startX: startX,
        startY: startY,
        x: x,
        y: y
      });
    }

    // ORIGINAL METHODS OVERRIDES
    // w.scroll and w.scrollTo
    w.scroll = w.scrollTo = function() {
      // avoid action when no arguments are passed
      if (arguments[0] === undefined) {
        return;
      }

      // avoid smooth behavior if not required
      if (shouldBailOut(arguments[0]) === true) {
        original.scroll.call(
          w,
          arguments[0].left !== undefined
            ? arguments[0].left
            : typeof arguments[0] !== 'object'
              ? arguments[0]
              : w.scrollX || w.pageXOffset,
          // use top prop, second argument if present or fallback to scrollY
          arguments[0].top !== undefined
            ? arguments[0].top
            : arguments[1] !== undefined
              ? arguments[1]
              : w.scrollY || w.pageYOffset
        );

        return;
      }

      // LET THE SMOOTHNESS BEGIN!
      smoothScroll.call(
        w,
        d.body,
        arguments[0].left !== undefined
          ? ~~arguments[0].left
          : w.scrollX || w.pageXOffset,
        arguments[0].top !== undefined
          ? ~~arguments[0].top
          : w.scrollY || w.pageYOffset
      );
    };

    // w.scrollBy
    w.scrollBy = function() {
      // avoid action when no arguments are passed
      if (arguments[0] === undefined) {
        return;
      }

      // avoid smooth behavior if not required
      if (shouldBailOut(arguments[0])) {
        original.scrollBy.call(
          w,
          arguments[0].left !== undefined
            ? arguments[0].left
            : typeof arguments[0] !== 'object' ? arguments[0] : 0,
          arguments[0].top !== undefined
            ? arguments[0].top
            : arguments[1] !== undefined ? arguments[1] : 0
        );

        return;
      }

      // LET THE SMOOTHNESS BEGIN!
      smoothScroll.call(
        w,
        d.body,
        ~~arguments[0].left + (w.scrollX || w.pageXOffset),
        ~~arguments[0].top + (w.scrollY || w.pageYOffset)
      );
    };

    // Element.prototype.scroll and Element.prototype.scrollTo
    Element.prototype.scroll = Element.prototype.scrollTo = function() {
      // avoid action when no arguments are passed
      if (arguments[0] === undefined) {
        return;
      }

      // avoid smooth behavior if not required
      if (shouldBailOut(arguments[0]) === true) {
        // if one number is passed, throw error to match Firefox implementation
        if (typeof arguments[0] === 'number' && arguments[1] === undefined) {
          throw new SyntaxError('Value could not be converted');
        }

        original.elementScroll.call(
          this,
          // use left prop, first number argument or fallback to scrollLeft
          arguments[0].left !== undefined
            ? ~~arguments[0].left
            : typeof arguments[0] !== 'object' ? ~~arguments[0] : this.scrollLeft,
          // use top prop, second argument or fallback to scrollTop
          arguments[0].top !== undefined
            ? ~~arguments[0].top
            : arguments[1] !== undefined ? ~~arguments[1] : this.scrollTop
        );

        return;
      }

      var left = arguments[0].left;
      var top = arguments[0].top;

      // LET THE SMOOTHNESS BEGIN!
      smoothScroll.call(
        this,
        this,
        typeof left === 'undefined' ? this.scrollLeft : ~~left,
        typeof top === 'undefined' ? this.scrollTop : ~~top
      );
    };

    // Element.prototype.scrollBy
    Element.prototype.scrollBy = function() {
      // avoid action when no arguments are passed
      if (arguments[0] === undefined) {
        return;
      }

      // avoid smooth behavior if not required
      if (shouldBailOut(arguments[0]) === true) {
        original.elementScroll.call(
          this,
          arguments[0].left !== undefined
            ? ~~arguments[0].left + this.scrollLeft
            : ~~arguments[0] + this.scrollLeft,
          arguments[0].top !== undefined
            ? ~~arguments[0].top + this.scrollTop
            : ~~arguments[1] + this.scrollTop
        );

        return;
      }

      this.scroll({
        left: ~~arguments[0].left + this.scrollLeft,
        top: ~~arguments[0].top + this.scrollTop,
        behavior: arguments[0].behavior
      });
    };

    // Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function() {
      // avoid smooth behavior if not required
      if (shouldBailOut(arguments[0]) === true) {
        original.scrollIntoView.call(
          this,
          arguments[0] === undefined ? true : arguments[0]
        );

        return;
      }

      // LET THE SMOOTHNESS BEGIN!
      var scrollableParent = findScrollableParent(this);
      var parentRects = scrollableParent.getBoundingClientRect();
      var clientRects = this.getBoundingClientRect();

      if (scrollableParent !== d.body) {
        // reveal element inside parent
        smoothScroll.call(
          this,
          scrollableParent,
          scrollableParent.scrollLeft + clientRects.left - parentRects.left,
          scrollableParent.scrollTop + clientRects.top - parentRects.top
        );

        // reveal parent in viewport unless is fixed
        if (w.getComputedStyle(scrollableParent).position !== 'fixed') {
          w.scrollBy({
            left: parentRects.left,
            top: parentRects.top,
            behavior: 'smooth'
          });
        }
      } else {
        // reveal element in viewport
        w.scrollBy({
          left: clientRects.left,
          top: clientRects.top,
          behavior: 'smooth'
        });
      }
    };
  }

  {
    // commonjs
    module.exports = { polyfill: polyfill };
  }

}());
}(smoothscroll));

var smoothScroll = smoothscroll.exports;

class FMP {
    constructor() {
        this.interval = 1000;
        this.len = 0;
        this.resolved = false;
        this.listener = [];
        this.timer = null;
        this.observe();
    }
    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    destroy() {
        this.listener.length = 0;
    }
    observe() {
        this.timer = window.setTimeout(() => {
            const entries = performance
                .getEntriesByType('resource')
                .filter((item) => this.isMatchType(item));
            const len = entries.length;
            if (len <= this.len) {
                performance.clearResourceTimings();
                this.clearTimer();
                this.resolved = true;
                if (this.listener.length) {
                    this.listener.forEach(run => run());
                }
                return;
            }
            this.len = len;
            this.observe();
        }, this.interval);
    }
    isMatchType(entry) {
        switch (entry.initiatorType) {
            case 'link':
            case 'img':
            case 'css':
            case 'iframe':
                return true;
        }
    }
    ready(fn) {
        if (this.resolved) {
            return fn();
        }
        this.listener.push(fn);
    }
}

class Observer {
    constructor() {
        this.id = 1;
        this.listenersMap = new Map();
    }
    on(key, fn) {
        const map = this.getListenersByKey(key);
        map.set(++this.id, fn);
        return this.id;
    }
    emit(key, ...args) {
        this.getListenersByKey(key).forEach(fn => {
            fn(...args);
        });
    }
    once(key, fn) {
        const onceFunc = (...args) => {
            fn(...args);
            this.off(key, id);
        };
        const id = this.on(key, onceFunc);
        return id;
    }
    flush(key) {
        this.getListenersByKey(key).clear();
    }
    destroy() {
        this.listenersMap.clear();
    }
    off(key, id) {
        const map = this.getListenersByKey(key);
        map.delete(id);
    }
    getListenersByKey(key) {
        const map = this.listenersMap.get(key) || new Map();
        this.listenersMap.set(key, map);
        return map;
    }
}
const observer = new Observer();

function createStore(reducer) {
    let state = reducer({});
    const listeners = [];
    function unsubscribe() {
        listeners.length = 0;
        dispatch({ type: 'RESET', data: {} });
    }
    function subscribe(listener) {
        listeners.push(listener);
    }
    function dispatch(action) {
        state = reducer(state, action);
        listeners.forEach(listener => {
            listener(state);
        });
    }
    function getState() {
        return state;
    }
    return {
        unsubscribe,
        subscribe,
        dispatch,
        getState
    };
}

function combineReducers(reducers) {
    const reducerKeys = Object.keys(reducers);
    return function combination(state, action) {
        const nextState = {};
        for (let i = 0; i < reducerKeys.length; i++) {
            const key = reducerKeys[i];
            const reducer = reducers[key];
            const previousStateForKey = state[key];
            const nextStateForKey = reducer(previousStateForKey, action);
            nextState[key] = nextStateForKey;
        }
        return nextState;
    };
}

const initState$2 = {
    startTime: 0,
    endTime: 0,
    duration: 0,
    packsInfo: []
};
var ProgressReducerTypes;
(function (ProgressReducerTypes) {
    ProgressReducerTypes["RESET"] = "RESET";
    ProgressReducerTypes["PROGRESS"] = "PROGRESS";
})(ProgressReducerTypes || (ProgressReducerTypes = {}));
function ProgressReducer(state, action) {
    if (!state) {
        state = initState$2;
    }
    if (!action) {
        return state;
    }
    const { type, data } = action;
    switch (type) {
        case ProgressReducerTypes.PROGRESS:
            return Object.assign(Object.assign({}, state), data);
        case ProgressReducerTypes.RESET:
            return Object.assign({}, initState$2);
        default:
            return state;
    }
}

const initState$1 = {
    speed: 0,
    options: {}
};
var PlayerReducerTypes;
(function (PlayerReducerTypes) {
    PlayerReducerTypes["RESET"] = "RESET";
    PlayerReducerTypes["SPEED"] = "SPEED";
    PlayerReducerTypes["OPTIONS"] = "OPTIONS";
})(PlayerReducerTypes || (PlayerReducerTypes = {}));
function PlayerReducer(state, action) {
    if (!state) {
        state = initState$1;
    }
    if (!action) {
        return state;
    }
    const { type, data } = action;
    switch (type) {
        case PlayerReducerTypes.OPTIONS:
            return Object.assign(Object.assign({}, state), { options: data.options });
        case PlayerReducerTypes.SPEED:
            return Object.assign(Object.assign({}, state), { speed: data.speed });
        case PlayerReducerTypes.RESET:
            return Object.assign({}, initState$1);
        default:
            return state;
    }
}

function getPacks(records) {
    const packs = [];
    const pack = [];
    records.forEach((record, i) => {
        if (i && record.type === RecordType.HEAD) {
            packs.push(pack.slice());
            pack.length = 0;
        }
        pack.push(record);
        if (records.length - 1 === i) {
            packs.push(pack);
        }
    });
    return packs;
}

const initState = {
    records: [],
    packs: [],
    currentData: {}
};
var ReplayDataReducerTypes;
(function (ReplayDataReducerTypes) {
    ReplayDataReducerTypes["RESET"] = "RESET";
    ReplayDataReducerTypes["UPDATE_DATA"] = "UPDATE_DATA";
    ReplayDataReducerTypes["APPEND_RECORDS"] = "APPEND_RECORDS";
})(ReplayDataReducerTypes || (ReplayDataReducerTypes = {}));
function ReplayDataReducer(state, action) {
    if (!state) {
        state = initState;
    }
    if (!action) {
        return state;
    }
    const { type, data } = action;
    switch (type) {
        case ReplayDataReducerTypes.APPEND_RECORDS:
            const records = state.records;
            records.push(...data.records);
            const packs = getPacks(records);
            state.packs = packs;
            return state;
        case ReplayDataReducerTypes.UPDATE_DATA:
            if (data.currentData && data.currentData) {
                window.G_REPLAY_DATA = data.currentData;
            }
            return Object.assign(Object.assign({}, state), data);
        case ReplayDataReducerTypes.RESET:
            return Object.assign({}, initState);
        default:
            return state;
    }
}

const reducer = combineReducers({
    player: PlayerReducer,
    progress: ProgressReducer,
    replayData: ReplayDataReducer
});
const Store = createStore(reducer);

var isMobile$2 = {exports: {}};

isMobile$2.exports = isMobile$1;
isMobile$2.exports.isMobile = isMobile$1;
isMobile$2.exports.default = isMobile$1;

const mobileRE = /(android|bb\d+|meego).+mobile|armv7l|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series[46]0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;

const tabletRE = /android|ipad|playbook|silk/i;

function isMobile$1 (opts) {
  if (!opts) opts = {};
  let ua = opts.ua;
  if (!ua && typeof navigator !== 'undefined') ua = navigator.userAgent;
  if (ua && ua.headers && typeof ua.headers['user-agent'] === 'string') {
    ua = ua.headers['user-agent'];
  }
  if (typeof ua !== 'string') return false

  let result = mobileRE.test(ua) || (!!opts.tablet && tabletRE.test(ua));

  if (
    !result &&
    opts.tablet &&
    opts.featureDetect &&
    navigator &&
    navigator.maxTouchPoints > 1 &&
    ua.indexOf('Macintosh') !== -1 &&
    ua.indexOf('Safari') !== -1
  ) {
    result = true;
  }

  return result
}

var mobile = isMobile$2.exports;

const ignoreNodeNames = ['VIDEO', 'IFRAME'];
function setAttribute(node, name, value) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
    }
    if (name === 'style') {
        if (typeof value === 'string') {
            node.style.cssText = completeCssHref(value);
        }
        else if (value !== null && typeof value === 'object') {
            for (const [k, v] of Object.entries(value)) {
                if (k[0] === '-') {
                    node.style.setProperty(k, v);
                }
                else {
                    node.style[k] = v;
                }
            }
        }
        return;
    }
    if (name === 'src' && ~ignoreNodeNames.indexOf(node.tagName)) {
        return;
    }
    if (value && typeof value === 'string' && /\.js$/.test(value)) {
        return;
    }
    if (/^\d+/.test(name)) {
        return;
    }
    if (/^on\w+$/.test(name)) {
        return;
    }
    if (value === null) {
        return node.removeAttribute(name);
    }
    value = String(value);
    if (name === 'href') {
        value = completeAttrHref(String(value), node);
    }
    if (name === 'background' || name === 'src') {
        if (value.startsWith('data:')) ;
        else {
            value = completeAttrHref(String(value), node);
        }
    }
    if (name === 'srcset') {
        const srcArray = value.split(',');
        value = srcArray
            .map(src => {
            const [url, size] = src.trim().split(' ');
            if (url && size) {
                return `${completeAttrHref(url, node)} ${size}`;
            }
            if (url) {
                return completeAttrHref(url, node);
            }
            return '';
        })
            .join(', ');
        value = decodeURIComponent(value);
    }
    if (value.startsWith('/')) {
        value = completeAttrHref(value, node);
    }
    try {
        node.setAttribute(name, value);
    }
    catch (err) {
        logError(err);
    }
}

function convertVNode(vNode, parent) {
    if (vNode === null || vNode === undefined) {
        return null;
    }
    const vs = vNode;
    if (vNode.type === Node.COMMENT_NODE) {
        return createCommentNode(vs);
    }
    if (vNode.type === Node.TEXT_NODE) {
        if (parent && parent.tag === 'style') {
            const baseUrl = parent === null || parent === void 0 ? void 0 : parent.attrs['css-url'];
            vs.value = completeCssHref(vs.value, baseUrl);
        }
        return createText(vs);
    }
    const vn = vNode;
    const output = createNode(vn);
    if ((vn.children && vn.children.length) || (output.childNodes && output.childNodes.length)) {
        travel(vn, output);
    }
    return output;
}
function travel(vNode, node) {
    const nodeChildren = [];
    const vNodeChildren = vNode.children.slice();
    vNodeChildren.forEach(vChild => {
        let child = nodeChildren.pop();
        child = convertVNode(vChild, vNode);
        if (child) {
            if (isHideComment(node.lastChild)) {
                setAttribute(child, 'style', 'visibility: hidden');
            }
            node.appendChild(child);
        }
    });
}
function createProps(vNode, node) {
    const { props } = vNode.extra;
    if (props) {
        for (const [key, val] of Object.entries(props)) {
            if (key === 'scroll') {
                const { left, top } = val;
                setTimeout(() => {
                    node.scrollTop = top;
                    node.scrollLeft = left;
                }, 1000);
            }
            else {
                node[key] = val;
            }
        }
    }
}
function createAttributes(vNode, node) {
    const attrs = getAttributes(vNode);
    for (const [name, val] of Object.entries(attrs)) {
        setAttribute(node, name, val);
    }
    if (vNode.tag === 'a') {
        node.setAttribute('target', '_blank');
    }
}
function getAttributes(vNode) {
    const attrs = Object.assign({}, vNode.attrs);
    return attrs;
}
function createSpecialNode(vsNode) {
    const { type, value, id } = vsNode;
    let output;
    switch (type) {
        case Node.TEXT_NODE:
            output = document.createTextNode(value);
            break;
        case Node.COMMENT_NODE:
            output = document.createComment(value);
            break;
    }
    nodeStore.updateNode(id, output);
    return output;
}
function createNode(vNode) {
    const { id, extra } = vNode;
    const { isSVG } = extra;
    let output;
    const tagName = transformTagName(vNode.tag);
    if (isSVG) {
        output = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    }
    else {
        output = document.createElement(tagName);
    }
    createAttributes(vNode, output);
    createProps(vNode, output);
    nodeStore.updateNode(id, output);
    return output;
}
function transformTagName(tag) {
    const tagMap = {
        script: 'noscript',
        altglyph: 'altGlyph',
        altglyphdef: 'altGlyphDef',
        altglyphitem: 'altGlyphItem',
        animatecolor: 'animateColor',
        animatemotion: 'animateMotion',
        animatetransform: 'animateTransform',
        clippath: 'clipPath',
        feblend: 'feBlend',
        fecolormatrix: 'feColorMatrix',
        fecomponenttransfer: 'feComponentTransfer',
        fecomposite: 'feComposite',
        feconvolvematrix: 'feConvolveMatrix',
        fediffuselighting: 'feDiffuseLighting',
        fedisplacementmap: 'feDisplacementMap',
        fedistantlight: 'feDistantLight',
        feflood: 'feFlood',
        fefunca: 'feFuncA',
        fefuncb: 'feFuncB',
        fefuncg: 'feFuncG',
        fefuncr: 'feFuncR',
        fegaussianblur: 'feGaussianBlur',
        feimage: 'feImage',
        femerge: 'feMerge',
        femergenode: 'feMergeNode',
        femorphology: 'feMorphology',
        feoffset: 'feOffset',
        fepointLight: 'fePointLight',
        fespecularlighting: 'feSpecularLighting',
        fespotlight: 'feSpotLight',
        fetile: 'feTile',
        feturbulence: 'feTurbulence',
        foreignobject: 'foreignObject',
        lineargradient: 'linearGradient',
        radialgradient: 'radialGradient',
        textpath: 'textPath'
    };
    const tagName = tagMap[tag] || tag;
    return tagName;
}
function createText(vs) {
    const { value, id } = vs;
    const output = document.createTextNode(value);
    nodeStore.updateNode(id, output);
    return output;
}
function createCommentNode(vs) {
    const { value, id } = vs;
    const output = document.createComment(value);
    nodeStore.updateNode(id, output);
    return output;
}

var FIXED_CSS = "/**\n * Copyright (c) oct16.\n * https://github.com/oct16\n * \n * This source code is licensed under the GPL-3.0 license found in the\n * LICENSE file in the root directory of this source tree.\n *\n */\ntextarea,\nbutton,\ndatalist,\nfieldset,\nform,\ninput,\nlabel,\nlegend,\nmeter,\noptgroup,\noption,\noutput,\nprogress,\nselect,\niframe {\n  pointer-events: none; }\n\nhtml, body {\n  scrollbar-width: none;\n  /* firefox */ }\n  html::-webkit-scrollbar, body::-webkit-scrollbar {\n    display: none; }\n";

function transToReplayData(records) {
    function isAudioPCMStr(record) {
        return record.type === 'pcm' && record.encode === 'base64';
    }
    function isAudioWAVStr(record) {
        return record.type === 'wav' && record.encode === 'base64';
    }
    const audio = {
        src: '',
        pcmStrList: [],
        wavStrList: [],
        subtitles: [],
        opts: {}
    };
    const replayData = {
        head: {},
        snapshot: {},
        records: [],
        audio,
        videos: []
    };
    const videosMap = new Map();
    records.forEach((record, index) => {
        const next = records[index + 1];
        if (record.type === RecordType.HEAD) {
            if (next && !next.data.frameId) {
                replayData.head = record;
            }
        }
        else if (record.type === RecordType.SNAPSHOT) {
            if (!record.data.frameId) {
                if (replayData) {
                    replayData.snapshot = record;
                }
            }
            else {
                replayData.records.push(record);
            }
        }
        else {
            switch (record.type) {
                case RecordType.AUDIO:
                    const { data: audioData } = record;
                    if (audioData.src) {
                        const data = audioData;
                        replayData.audio.src = data.src;
                        replayData.audio.subtitles = data.subtitles;
                    }
                    else if (isAudioPCMStr(audioData)) {
                        replayData.audio.pcmStrList.push(...audioData.data);
                    }
                    else if (isAudioWAVStr(audioData)) {
                        replayData.audio.wavStrList.push(...audioData.data);
                    }
                    else {
                        replayData.audio.opts = audioData.data;
                    }
                    replayData.records.push(record);
                    break;
                case RecordType.VIDEO:
                    const { data, time } = record;
                    const { id, dataStr } = data;
                    if (!dataStr) {
                        break;
                    }
                    const videoData = videosMap.get(id);
                    if (videoData) {
                        videoData.bufferStrList.push(dataStr);
                        videoData.endTime = time;
                    }
                    else {
                        const newVideoData = {
                            id,
                            startTime: time,
                            endTime: time,
                            bufferStrList: [dataStr]
                        };
                        videosMap.set(id, newVideoData);
                    }
                    replayData.records.push(record);
                    break;
            }
            if (replayData) {
                replayData.records.push(record);
            }
        }
    });
    if (videosMap.size) {
        const videos = Array.from(videosMap.entries()).map(([, video]) => {
            const { bufferStrList, startTime, endTime, id } = video;
            const chunks = bufferStrList.map(str => {
                const buffer = base64ToBufferArray(str);
                const blob = new Blob([buffer], { type: 'video/webm;codecs=vp9' });
                return blob;
            });
            const steam = new Blob(chunks, { type: 'video/webm' });
            const blobUrl = window.URL.createObjectURL(steam);
            return {
                id,
                src: blobUrl,
                startTime,
                endTime
            };
        });
        replayData.videos.push(...videos);
    }
    return replayData;
}
function parseHtmlStr(htmlStr) {
    const parser = new DOMParser();
    const children = parser.parseFromString(htmlStr, 'text/html').body.children;
    return [...children];
}
function isMobile(ua) {
    if (!ua) {
        return false;
    }
    return mobile({ ua });
}
function showStartMask(c) {
    const startPage = c.container.querySelector('.player-start-page');
    startPage.setAttribute('style', '');
}
function showStartBtn(el) {
    const startPage = el.querySelector('.player-start-page');
    const btn = startPage.querySelector('.play-btn');
    btn.classList.add('show');
    return btn;
}
function removeStartPage(el) {
    var _a;
    const startPage = el.querySelector('.player-start-page');
    (_a = startPage === null || startPage === void 0 ? void 0 : startPage.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(startPage);
}
function waitStart(el) {
    return __awaiter(this, void 0, void 0, function* () {
        const btn = showStartBtn(el);
        return new Promise(r => {
            btn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                btn.classList.remove('show');
                yield delay(500);
                r();
            }));
        });
    });
}
function createIframeDOM(contentDocument, snapshotData) {
    contentDocument.open();
    const doctype = snapshotData.doctype;
    const doc = `<!DOCTYPE ${doctype.name} ${doctype.publicId ? 'PUBLIC ' + '"' + doctype.publicId + '"' : ''} ${doctype.systemId ? '"' + doctype.systemId + '"' : ''}><html><head></head><body></body></html>`;
    contentDocument.write(doc);
}
function injectIframeContent(contentDocument, snapshotData) {
    const content = convertVNode(snapshotData.vNode);
    if (content) {
        const head = content.querySelector('head');
        if (head) {
            const style = parseHtmlStr(`<div>
                    <style>
                        ${FIXED_CSS}
                    </style>
                </div>`)[0].firstElementChild;
            head.appendChild(style);
        }
        const documentElement = contentDocument.documentElement;
        content.scrollLeft = snapshotData.scrollLeft;
        content.scrollTop = snapshotData.scrollTop;
        contentDocument.replaceChild(content, documentElement);
    }
}

const shallowEqual = (prevProps, nextProps) => {
    if (prevProps === nextProps) {
        return true;
    }
    if (!(typeof prevProps === 'object' && prevProps != null) ||
        !(typeof nextProps === 'object' && nextProps != null)) {
        return false;
    }
    const keysA = Object.keys(prevProps);
    const keysB = Object.keys(nextProps);
    if (keysA.length !== keysB.length) {
        return false;
    }
    for (let i = 0; i < keysA.length; i++) {
        if (nextProps.hasOwnProperty(keysA[i])) {
            if (prevProps[keysA[i]] !== nextProps[keysA[i]]) {
                return false;
            }
        }
        else {
            return false;
        }
    }
    return true;
};
const provider = (store) => {
    return (mapStateToProps) => {
        let props;
        return (render) => {
            const getProps = () => mapStateToProps(store.getState());
            store.subscribe(() => {
                const newProps = getProps();
                if (shallowEqual(newProps, props)) {
                    return;
                }
                render((props = newProps));
            });
        };
    };
};
const connect = provider(Store);
const ConnectProps = (mapStateToProps) => {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (cb) {
            connect(mapStateToProps)(state => {
                originalMethod.call(this, state);
                cb && cb(state);
            });
        };
    };
};

class HeatBarBase {
    constructor(target, points = []) {
        this.ratio = 2;
        this.target = target;
        this.points = points;
        const targetWidth = this.target.offsetWidth * this.ratio;
        const targetHeight = this.target.offsetHeight * this.ratio;
        this.targetWidth = target.width = targetWidth;
        this.targetHeight = target.height = targetHeight;
        this.context = target.getContext('2d');
    }
    radiusRect(x, y, w, h, r, color = '#fff') {
        const min_size = Math.min(w, h);
        if (r > min_size / 2) {
            r = min_size / 2;
        }
        this.context.fillStyle = color;
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.moveTo(x + r, y);
        this.context.arcTo(x + w, y, x + w, y + h, r);
        this.context.arcTo(x + w, y + h, x, y + h, r);
        this.context.arcTo(x, y + h, x, y, r);
        this.context.arcTo(x, y, x + w, y, r);
        this.context.closePath();
        this.context.stroke();
        this.context.fill();
    }
}

class Pillar extends HeatBarBase {
    constructor(target, points) {
        super(target, points);
        this.draw();
    }
    draw() {
        const points = this.points;
        const len = points.length;
        const reactWidth = this.targetWidth / (len * 2);
        const reactHeight = this.targetHeight;
        const max = Math.max.apply(null, points.map(p => p.step));
        for (let i = 0; i < len; i++) {
            const point = points[i];
            if (!point.step) {
                continue;
            }
            const x = i * 2 * reactWidth;
            const y = 2;
            const w = reactWidth;
            const maxHeight = reactHeight * 0.9;
            const sinCurve = Math.sin((point.step / max) * (Math.PI / 2));
            const z = 0.16;
            const scale = sinCurve * (1 - z) + z;
            const h = point.snapshot ? maxHeight : scale * maxHeight;
            const color = point.snapshot ? '#6AD1C7' : '#fff';
            this.radiusRect(x, y, w, h, 2, color);
        }
    }
}

class NormalLine extends HeatBarBase {
    constructor(target) {
        super(target);
        this.draw();
    }
    draw() {
        if (!this.targetWidth) {
            return;
        }
        const radius = 4;
        this.radiusRect(radius, 2 * radius, this.targetWidth - 2 * radius, 8, radius);
    }
}

function Component(name, html, opts) {
    return function (constructor) {
        if (!customElements.get(name))
            customElements.define(name, class extends HTMLElement {
                constructor() {
                    var _a, _b;
                    super();
                    const child = parseHtmlStr(html)[0];
                    constructor.prototype.target = child;
                    const slot = child.getElementsByTagName('slot')[0];
                    if (slot && ((_a = this.children) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                        const parent = slot.parentElement;
                        [...this.children].forEach(el => parent === null || parent === void 0 ? void 0 : parent.insertBefore(el, null));
                        parent === null || parent === void 0 ? void 0 : parent.removeChild(slot);
                    }
                    if (opts === null || opts === void 0 ? void 0 : opts.isShadow) {
                        this.attachShadow({ mode: 'open' }).append(child);
                    }
                    else {
                        (_b = this.parentElement) === null || _b === void 0 ? void 0 : _b.replaceChild(child, this);
                    }
                    constructor.prototype.parent = child.parentElement;
                }
            });
    };
}
const html = function (strings, ...values) {
    let str = '';
    strings.forEach((string, i) => {
        str += string + (values[i] || '');
    });
    return str;
};

function disableScrolling(target) {
    const keys = { 37: 1, 38: 1, 39: 1, 40: 1 };
    function preventDefault(e) {
        e.preventDefault();
    }
    function preventDefaultForScrollKeys(e) {
        if (keys[e.keyCode]) {
            preventDefault(e);
            return false;
        }
    }
    let supportsPassive = false;
    try {
        target.addEventListener('test', () => { }, Object.defineProperty({}, 'passive', {
            get: function () {
                supportsPassive = true;
            }
        }));
    }
    catch (e) { }
    const wheelOpt = supportsPassive ? { passive: false } : false;
    const wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';
    function disableScroll() {
        target.addEventListener('DOMMouseScroll', preventDefault, false);
        target.addEventListener(wheelEvent, preventDefault, wheelOpt);
        target.addEventListener('touchmove', preventDefault, wheelOpt);
        target.addEventListener('keydown', preventDefaultForScrollKeys, false);
    }
    disableScroll();
}

const ringCss = `.lds-ring{margin-left:-40px;margin-top:-40px;width:80px;height:80px;position:absolute;left:50%;top:50%}.lds-ring div{box-sizing:border-box;display:block;position:absolute;width:64px;height:64px;margin:8px;border:8px solid grey;border-radius:50%;animation:lds-ring 1.2s cubic-bezier(0.5,0,0.5,1) infinite;border-color:grey transparent transparent transparent}.lds-ring div:nth-child(1){animation-delay:-0.45s}.lds-ring div:nth-child(2){animation-delay:-0.3s}.lds-ring div:nth-child(3){animation-delay:-0.15s}@keyframes lds-ring{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;
const normalLoading = `<div class="lds-ring"><style>${ringCss}<\/style><div></div><div></div><div></div><div></div></div>`;

var PlayerEventTypes;
(function (PlayerEventTypes) {
    PlayerEventTypes["PLAY"] = "play";
    PlayerEventTypes["PAUSE"] = "pause";
    PlayerEventTypes["STOP"] = "stop";
    PlayerEventTypes["SPEED"] = "speed";
    PlayerEventTypes["RESIZE"] = "resize";
    PlayerEventTypes["PROGRESS"] = "progress";
    PlayerEventTypes["JUMP"] = "jump";
})(PlayerEventTypes || (PlayerEventTypes = {}));

let KeyboardComponent = class KeyboardComponent {
    constructor(options, container) {
        this.options = options;
        this.c = container;
        this.init();
    }
    watchPlayerSpeed(state) {
        if (state) {
            this.paly(state.speed);
            this.setSpeed(state.speed);
        }
    }
    init() {
        this.controller = this.c.container.querySelector('.player-keyboard');
        this.playOrPauseBtn = this.c.container.querySelector('.play-or-pause');
        this.createFastForwards(this.options.fastForward);
        const controllerHandler = (e) => {
            if (e.target && e.target.type === 'button') {
                const speed = Number(e.target.getAttribute('speed'));
                this.dispatchPlay(speed);
            }
        };
        this.controller.addEventListener('click', controllerHandler, false);
        this.options.destroyStore.add(() => {
            this.controller.removeEventListener('click', controllerHandler, false);
        });
        this.watchPlayerSpeed();
        this.detectWindowIsActive();
    }
    createFastForwards(speeds) {
        speeds = Array.from(new Set([1].concat(speeds)));
        if (speeds) {
            const htmlStr = speeds.reduce((s, speed) => s + html `<button type="button" class="speed" speed="${speed}">${speed}x</button>`, '');
            this.controller.append(...parseHtmlStr(htmlStr));
        }
    }
    dispatchPlay(speed = 0) {
        Store.dispatch({
            type: PlayerReducerTypes.SPEED,
            data: {
                speed
            }
        });
    }
    detectWindowIsActive() {
        const handler = () => {
            if (document.visibilityState === 'hidden') {
                this.dispatchPlay(0);
            }
        };
        document.addEventListener('visibilitychange', handler, false);
        this.options.destroyStore.add(() => {
            document.removeEventListener('visibilitychange', handler, false);
        });
    }
    paly(speed) {
        if (speed !== 0) {
            this.playOrPauseBtn.innerText = '〓';
            this.playOrPauseBtn.setAttribute('style', 'letter-spacing: 1px;font-weight: bold;');
            this.playOrPauseBtn.removeAttribute('speed');
        }
        else {
            this.playOrPauseBtn.innerText = '▲';
            this.playOrPauseBtn.removeAttribute('style');
            this.playOrPauseBtn.setAttribute('speed', '1');
        }
    }
    setSpeed(speed) {
        const speedNodes = this.c.container.querySelectorAll('.speed');
        [...speedNodes].forEach(node => {
            node.removeAttribute('disabled');
        });
        const index = getBtnIndex(speed);
        function getBtnIndex(speed) {
            return [...speedNodes].findIndex(node => node.getAttribute('speed') === speed.toString());
        }
        if (index > -1) {
            speedNodes[index].setAttribute('disabled', '');
        }
    }
};
__decorate([
    ConnectProps(state => ({
        speed: state.player.speed
    }))
], KeyboardComponent.prototype, "watchPlayerSpeed", null);
KeyboardComponent = __decorate([
    Component('player-keyboard', html `<div class="player-keyboard">
        <button class="play-or-pause" type="button" speed="1">▲</button>
    </div>`)
], KeyboardComponent);

function renderFont(data) {
    const { family, source } = data;
    const buffer = new Uint8Array(source.length);
    for (let i = 0; i < source.length; i++) {
        const code = source.charCodeAt(i);
        buffer[i] = code;
    }
    const font = new window.FontFace(family, buffer);
    this.c.sandBoxDoc.fonts.add(font);
    document.fonts.add(font);
}

function renderPatch(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, key, url, tag, text } = data;
        const node = nodeStore.getNode(id);
        if (!node) {
            yield delay(1000);
        }
        const n = node;
        if (n && n.getAttribute(key) === url && n.tagName === tag.toUpperCase()) {
            if (tag === 'link') {
                const replaceNode = document.createElement('style');
                replaceNode.setAttribute('type', 'text/css');
                replaceNode.setAttribute('css-url', url);
                replaceNode.innerHTML = text;
                n.replaceWith(replaceNode);
            }
        }
    });
}

function renderLocation(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { path, hash, href, contextNodeId } = data;
        const contextNode = nodeStore.getNode(contextNodeId);
        if (contextNode) {
            const context = contextNode.ownerDocument.defaultView;
            context.G_REPLAY_LOCATION = Object.assign(Object.assign({}, context.G_REPLAY_LOCATION), { path, hash, href });
        }
    });
}

function renderSnapshot(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const snapshotData = data;
        const { frameId } = snapshotData;
        if (frameId) {
            const iframeNode = nodeStore.getNode(frameId);
            if (iframeNode) {
                const src = iframeNode.getAttribute('src');
                if (src) {
                    setAttribute(iframeNode, 'disabled-src', src);
                    setAttribute(iframeNode, 'src', null);
                }
                const contentDocument = iframeNode.contentDocument;
                createIframeDOM(contentDocument, snapshotData);
                injectIframeContent(contentDocument, snapshotData);
            }
        }
    });
}

function renderScroll(data) {
    var _a;
    const { top, left, id, behavior: b } = data;
    const target = id ? nodeStore.getNode(id) : this.c.sandBoxDoc.documentElement;
    if (!target) {
        return;
    }
    const curTop = target.scrollTop;
    const height = window.G_REPLAY_DATA.snapshot.data.height;
    const behavior = b || Math.abs(top - curTop) > height * 3 ? 'auto' : 'smooth';
    const opts = {
        top,
        left,
        behavior
    };
    try {
        target.scroll(opts);
    }
    catch (error) {
        if (target.nodeName === 'HTML') {
            (_a = target.ownerDocument.defaultView) === null || _a === void 0 ? void 0 : _a.scroll(opts);
        }
        else {
            target.scrollLeft = left;
            target.scrollTop = top;
        }
    }
}

function renderWindow(data) {
    const { width, height, id } = data;
    let target;
    if (id) {
        target = nodeStore.getNode(id);
        target.style.width = width + 'px';
        target.style.height = height + 'px';
    }
    else {
        target = this.c.sandBoxDoc.body;
        this.c.resize({ setWidth: width, setHeight: height });
    }
}

function renderMouse(data) {
    const { x, y, id, type } = data;
    let left = 0, top = 0;
    if (id) {
        const node = nodeStore.getNode(id);
        let rect = {};
        if (node && node.getBoundingClientRect) {
            rect = node.getBoundingClientRect();
        }
        const { left: nodeLeft, top: nodeTop } = rect;
        left = nodeLeft;
        top = nodeTop;
    }
    if (type === MouseEventType.MOVE) {
        this.pointer.move(x + left, y + top);
    }
    else if (type === MouseEventType.CLICK) {
        this.pointer.click(x + left, y + top);
    }
}

function renderFormEl(data, opts) {
    const { isJumping } = opts || {};
    const { id, key, type: formType, value, patches } = data;
    const node = nodeStore.getNode(id);
    const { mode } = Store.getState().player.options;
    if (node) {
        if (formType === FormElementEvent.INPUT || formType === FormElementEvent.CHANGE) {
            if (patches && patches.length) {
                const newValue = revertStrByPatches(node.value, patches);
                node.value = newValue;
            }
            else if (key) {
                node[key] = value;
            }
        }
        else if (formType === FormElementEvent.FOCUS) {
            mode !== 'live' && !isJumping && node.focus && node.focus({ preventScroll: true });
        }
        else if (formType === FormElementEvent.BLUR) {
            mode !== 'live' && !isJumping && node.blur && node.blur();
        }
        else if (formType === FormElementEvent.PROP) {
            if (key) {
                node[key] = value;
            }
        }
    }
}

function insertOrMoveNode(data, orderSet) {
    const { parentId, nextId, node } = data;
    const parentNode = nodeStore.getNode(parentId);
    const findNextNode = (nextId) => {
        return nextId ? nodeStore.getNode(nextId) : null;
    };
    if (parentNode && isElementNode(parentNode)) {
        let nextNode = null;
        if (nextId) {
            if (orderSet.has(nextId)) {
                return true;
            }
            nextNode = findNextNode(nextId);
            if (!nextNode) {
                return true;
            }
            if (!parentNode.contains(nextNode)) {
                return true;
            }
        }
        const n = node;
        let insertNode;
        if (typeof node === 'number') {
            insertNode = nodeStore.getNode(node);
            if (orderSet.has(node)) {
                orderSet.delete(node);
            }
        }
        else if (isVNode(n)) {
            insertNode = convertVNode(n);
        }
        else {
            insertNode = createSpecialNode(n);
        }
        if (insertNode) {
            parentNode.insertBefore(insertNode, nextNode);
        }
    }
    else {
        return true;
    }
}
function renderDom(data) {
    const { addedNodes, movedNodes, removedNodes, attrs, texts } = data;
    removedNodes &&
        removedNodes.forEach((data) => {
            const { parentId, id } = data;
            const parentNode = nodeStore.getNode(parentId);
            const node = nodeStore.getNode(id);
            if (node && parentNode && parentNode.contains(node)) {
                parentNode.removeChild(node);
            }
        });
    const orderSet = new Set();
    const movedList = (movedNodes && movedNodes.slice()) || [];
    movedList.forEach(data => {
        if (data.nextId) {
            if (movedList.some(a => a.id === data.nextId)) {
                orderSet.add(data.nextId);
            }
        }
    });
    const addedList = movedList
        .map(item => {
        const { id, parentId, nextId } = item;
        return {
            node: id,
            parentId,
            nextId
        };
    })
        .concat((addedNodes && addedNodes.slice()) || []);
    if (addedList) {
        const n = addedList.length;
        const maxRevertCount = n > 0 ? (n * n + n) / 2 : 0;
        let revertCount = 0;
        while (addedList.length) {
            const addData = addedList.shift();
            if (addData) {
                if (insertOrMoveNode(addData, orderSet)) {
                    if (revertCount++ < maxRevertCount) {
                        addedList.push(addData);
                    }
                }
            }
        }
    }
    attrs &&
        attrs.forEach((attr) => {
            const { id, key, value } = attr;
            const node = nodeStore.getNode(id);
            if (node) {
                setAttribute(node, key, value);
            }
        });
    texts &&
        texts.forEach((text) => {
            const { id, value, parentId } = text;
            const parentNode = nodeStore.getNode(parentId);
            const node = nodeStore.getNode(id);
            if (parentNode && node) {
                if (isExistingNode(node)) {
                    node.textContent = value;
                    return;
                }
                parentNode.innerText = value;
            }
        });
}

function renderAll(recordData, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const { isJumping, speed } = opts || {};
        const delayTime = isJumping ? 0 : 200;
        const { type, data } = recordData;
        const actionDelay = () => (delayTime ? delay(delayTime) : Promise.resolve());
        switch (type) {
            case RecordType.SNAPSHOT: {
                renderSnapshot(data);
                break;
            }
            case RecordType.SCROLL: {
                renderScroll.call(this, data);
                break;
            }
            case RecordType.WINDOW: {
                renderWindow.call(this, data);
                break;
            }
            case RecordType.MOUSE: {
                renderMouse.call(this, data);
                break;
            }
            case RecordType.DOM: {
                if (!isJumping && speed === 1) {
                    yield actionDelay();
                }
                renderDom(data);
                break;
            }
            case RecordType.FORM_EL: {
                if (!isJumping && speed === 1) {
                    yield actionDelay();
                }
                renderFormEl(data, { isJumping });
                break;
            }
            case RecordType.LOCATION: {
                renderLocation(data);
                break;
            }
            case RecordType.FONT: {
                renderFont.call(this, data);
                break;
            }
            case RecordType.PATCH: {
                renderPatch(data);
                break;
            }
        }
    });
}

let PlayerComponent = class PlayerComponent {
    constructor(options, c, pointer, progress, broadcaster) {
        this.speed = 0;
        this.recordIndex = 0;
        this.frameIndex = 0;
        this.isFirstTimePlay = true;
        this.maxFrameInterval = 250;
        this.maxFps = 30;
        this.animationDelayTime = 300;
        this.elapsedTime = 0;
        this.audioOffset = 150;
        this.curViewDiffTime = 0;
        this.preViewsDurationTime = 0;
        this.viewIndex = 0;
        this.subtitlesIndex = 0;
        this.maxIntensityStep = 8;
        this.options = options;
        this.c = c;
        this.pointer = pointer;
        this.progress = progress;
        this.broadcaster = broadcaster;
        this.init();
    }
    watchPlayerSpeed(state) {
        if (state) {
            const speed = state.speed;
            const curSpeed = this.speed;
            this.speed = speed;
            observer.emit(PlayerEventTypes.SPEED, speed);
            if (speed > 0) {
                this.play();
                if (curSpeed === 0) {
                    observer.emit(PlayerEventTypes.PLAY);
                }
            }
            else {
                this.pause();
            }
        }
    }
    watchProgress() {
        this.recalculateProgress();
        this.viewsLength = Store.getState().replayData.packs.length;
    }
    watcherProgressJump() {
        observer.on(PlayerEventTypes.JUMP, (state) => __awaiter(this, void 0, void 0, function* () { return this.jump(state, true); }));
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.audioNode = new Audio();
            this.calcFrames();
            this.viewsLength = Store.getState().replayData.packs.length;
            this.initViewState();
            this.setViewState();
            if (this.records.length <= 2) {
                window.addEventListener('record-data', this.streamHandle.bind(this));
                this.options.destroyStore.add(() => window.removeEventListener('record-data', this.streamHandle.bind(this)));
            }
            else {
                this.watchProgress();
                this.watchPlayerSpeed();
                this.watcherProgressJump();
            }
            observer.on(PlayerEventTypes.RESIZE, () => __awaiter(this, void 0, void 0, function* () {
                yield delay(500);
                this.recalculateProgress();
            }));
            observer.on(PlayerEventTypes.PROGRESS, (frame) => {
                const percent = frame / (this.frames.length - 1);
                this.progress.setProgressPosition(percent);
            });
        });
    }
    initAudio() {
        if (!this.audioData) {
            return;
        }
        if (this.audioData.src) {
            this.audioBlobUrl = location.href.split('/').slice(0, -1).join('/') + '/' + this.audioData.src;
        }
        else {
            const { wavStrList, pcmStrList } = this.audioData;
            let type = undefined;
            const list = [];
            if (wavStrList.length) {
                type = 'wav';
                list.push(...wavStrList);
            }
            else if (pcmStrList.length) {
                type = 'pcm';
                list.push(...pcmStrList);
            }
            if (!type) {
                return;
            }
            const dataArray = [];
            for (let i = 0; i < list.length; i++) {
                const data = base64ToFloat32Array(list[i]);
                dataArray.push(data);
            }
            const audioBlob = type === 'wav' ? new Blob(dataArray, { type: 'audio/wav' }) : encodeWAV(dataArray, this.audioData.opts);
            const audioBlobUrl = URL.createObjectURL(audioBlob);
            this.audioBlobUrl = audioBlobUrl;
        }
    }
    mountVideos() {
        if (!this.videos || !this.videos.length) {
            return;
        }
        this.videos.forEach(video => {
            const { src, id } = video;
            const videoElement = nodeStore.getNode(id);
            if (videoElement) {
                const target = videoElement;
                target.muted = true;
                target.autoplay = target.loop = target.controls = false;
                target.src = src;
            }
        });
    }
    streamHandle(e) {
        const record = e.detail;
        if (isSnapshot(record)) {
            Store.getState().replayData.currentData.snapshot = record;
            this.setViewState();
            return;
        }
        this.execFrame(record);
    }
    initViewState() {
        const { currentData } = Store.getState().replayData;
        const { records, audio, videos, head } = currentData;
        this.records = this.processing(records);
        this.audioData = audio;
        this.videos = videos;
        const { userAgent } = (head === null || head === void 0 ? void 0 : head.data) || {};
        if (isMobile(userAgent)) {
            this.pointer.hidePointer();
        }
        if (!this.records.length) {
            return;
        }
        this.subtitlesIndex = 0;
        this.broadcaster.cleanText();
        this.curViewStartTime = (head && head.time) || records[0].time;
        this.curViewEndTime = records.slice(-1)[0].time;
        this.preViewsDurationTime = 0;
        this.curViewDiffTime = 0;
        this.viewIndex = 0;
    }
    setViewState() {
        this.c.setViewState();
        this.initAudio();
        this.mountVideos();
    }
    jump(state, shouldLoading = false) {
        return __awaiter(this, void 0, void 0, function* () {
            this.isJumping = true;
            this.shouldWaitForSync = true;
            let loading = undefined;
            const { speed } = Store.getState().player;
            const { index, time, percent } = state;
            if (shouldLoading) {
                this.pause(false);
                loading = parseHtmlStr(normalLoading)[0];
                this.c.container.appendChild(loading);
                yield delay(100);
            }
            const nextReplayData = this.getNextReplayData(index);
            if (!nextReplayData) {
                return;
            }
            this.initViewState();
            if (this.viewIndex !== index || this.startTime >= time) {
                const [{ packsInfo }, { packs }] = [Store.getState().progress, Store.getState().replayData];
                const diffTime = packsInfo[index].diffTime;
                this.curViewEndTime = packs[index].slice(-1)[0].time;
                this.curViewDiffTime = diffTime;
                this.preViewsDurationTime = packsInfo.slice(0, index).reduce((a, b) => a + b.duration, 0);
                this.viewIndex = index;
                this.records = packs[index];
            }
            const frameIndex = 1 +
                this.frames.findIndex((t, i) => {
                    const cur = t;
                    const next = this.frames[i + 1] || cur + 1;
                    if (time >= cur && time <= next) {
                        return true;
                    }
                });
            this.frameIndex = frameIndex;
            this.initTime = getTime();
            this.recordIndex = 0;
            this.audioData = nextReplayData.audio;
            this.startTime = time;
            this.subtitlesIndex = 0;
            if (percent !== undefined) {
                this.progress.moveThumb(percent);
                yield delay(100);
            }
            this.setViewState();
            this.playAudio();
            this.loopFramesByTime(this.frames[this.frameIndex]);
            if (loading) {
                yield delay(100);
                this.c.container.removeChild(loading);
                Store.dispatch({ type: PlayerReducerTypes.SPEED, data: { speed } });
            }
            this.isJumping = false;
            setTimeout(() => (this.shouldWaitForSync = false), 100);
        });
    }
    getNextReplayData(index) {
        const { packs } = Store.getState().replayData;
        const nextPack = packs[index];
        if (nextPack) {
            const nextData = transToReplayData(nextPack);
            Store.dispatch({ type: ReplayDataReducerTypes.UPDATE_DATA, data: { currentData: nextData } });
            return nextData;
        }
        return null;
    }
    loopFramesByTime(currTime, isJumping = false) {
        let nextTime = this.frames[this.frameIndex];
        while (nextTime && currTime >= nextTime) {
            if (!isJumping) {
                observer.emit(PlayerEventTypes.PROGRESS, this.frameIndex, this.frames.length - 1);
            }
            this.frameIndex++;
            this.renderEachFrame();
            nextTime = this.frames[this.frameIndex];
        }
        return nextTime;
    }
    play() {
        if (this.frameIndex === 0) {
            this.progress.moveThumb();
            if (!this.isFirstTimePlay) {
                this.getNextReplayData(0);
                this.initViewState();
                this.setViewState();
            }
            else {
                this.progress.drawHeatPoints();
            }
        }
        this.playAudio();
        this.isFirstTimePlay = false;
        if (this.RAF && this.RAF.requestID) {
            this.RAF.stop();
        }
        this.RAF = new AnimationFrame(loop.bind(this), this.maxFps);
        this.options.destroyStore.add(() => this.RAF.stop());
        this.RAF.start();
        this.initTime = getTime();
        this.startTime = this.frames[this.frameIndex];
        function loop(t, loopIndex) {
            return __awaiter(this, void 0, void 0, function* () {
                const timeStamp = getTime() - this.initTime;
                if (this.frameIndex > 0 && this.frameIndex >= this.frames.length) {
                    this.stop();
                    return;
                }
                const currTime = this.startTime + timeStamp * this.speed;
                const nextTime = this.loopFramesByTime(currTime);
                if (nextTime > this.curViewEndTime - this.curViewDiffTime && this.viewIndex < this.viewsLength - 1) {
                    const { packsInfo } = Store.getState().progress;
                    const index = this.viewIndex + 1;
                    const { startTime, diffTime } = packsInfo[index];
                    this.jump({ index: index, time: startTime - diffTime });
                }
                this.elapsedTime = (currTime - this.frames[0]) / 1000;
                this.syncAudio();
                this.syncVideos();
            });
        }
    }
    playAudio() {
        if (!this.audioData) {
            return;
        }
        if (!this.audioBlobUrl) {
            this.pauseAudio();
            return;
        }
        if (this.audioNode) {
            if (!this.audioNode.src || this.audioNode.src !== this.audioBlobUrl) {
                this.audioNode.src = this.audioBlobUrl;
            }
            this.syncAudioTargetNode();
            if (this.speed > 0) {
                this.audioNode.play();
            }
        }
    }
    syncAudio() {
        if (!this.audioNode) {
            return;
        }
        const targetCurrentTime = this.audioNode.currentTime;
        const targetExpectTime = this.elapsedTime - this.preViewsDurationTime / 1000;
        const diffTime = Math.abs(targetExpectTime - targetCurrentTime);
        const allowDiff = (100 + this.audioOffset) / 1000;
        if (diffTime > allowDiff) {
            this.syncAudioTargetNode();
        }
    }
    syncAudioTargetNode() {
        const elapsedTime = this.elapsedTime - this.preViewsDurationTime / 1000;
        const offset = this.audioOffset / 1000;
        this.audioNode.currentTime = elapsedTime + offset;
    }
    syncVideos() {
        const initTime = this.curViewStartTime;
        const currentTime = initTime + (this.elapsedTime * 1000 - this.preViewsDurationTime);
        const allowDiff = 100;
        this.videos.forEach(video => {
            const { startTime, endTime, id } = video;
            const target = nodeStore.getNode(id);
            if (!target) {
                return;
            }
            if (currentTime >= startTime && currentTime < endTime) {
                if (target.paused && this.speed > 0) {
                    target.play();
                }
                const targetCurrentTime = target.currentTime;
                const targetExpectTime = this.elapsedTime - this.preViewsDurationTime / 1000 - (startTime - initTime) / 1000;
                const diffTime = Math.abs(targetExpectTime - targetCurrentTime);
                if (diffTime > allowDiff / 1000) {
                    target.currentTime = targetExpectTime;
                }
            }
            else {
                if (!target.paused) {
                    target.pause();
                }
            }
        });
    }
    pauseAudio() {
        if (this.audioNode) {
            this.audioNode.pause();
        }
    }
    pauseVideos() {
        if (this.videos && this.videos.length) {
            this.videos.forEach(video => {
                const target = nodeStore.getNode(video.id);
                if (target) {
                    target.pause();
                }
            });
        }
    }
    renderEachFrame() {
        this.progress.updateTimer(this.frameIndex, this.frameInterval, this.curViewDiffTime);
        let data;
        while (this.recordIndex < this.records.length &&
            (data = this.records[this.recordIndex]).time - this.curViewDiffTime <= this.frames[this.frameIndex]) {
            this.execFrame(data);
            this.recordIndex++;
        }
        this.syncSubtitles();
    }
    syncSubtitles() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.shouldWaitForSync) {
                return;
            }
            if (this.audioData && this.audioData.subtitles.length) {
                const subtitles = this.audioData.subtitles;
                let { text } = subtitles[this.subtitlesIndex];
                const { end } = subtitles[this.subtitlesIndex];
                const audioEndTime = toTimeStamp(end);
                if (this.elapsedTime > audioEndTime / 1000) {
                    this.broadcaster.cleanText();
                    if (this.subtitlesIndex < subtitles.length - 1) {
                        while (true) {
                            const nextEndTime = toTimeStamp(subtitles[this.subtitlesIndex].end);
                            if (nextEndTime / 1000 > this.elapsedTime) {
                                break;
                            }
                            this.subtitlesIndex++;
                        }
                        text = subtitles[this.subtitlesIndex].text;
                    }
                }
                this.broadcaster.updateText(text);
            }
        });
    }
    pause(emit = true) {
        if (this.RAF) {
            this.RAF.stop();
        }
        Store.dispatch({
            type: PlayerReducerTypes.SPEED,
            data: {
                speed: 0
            }
        });
        this.pauseAudio();
        this.pauseVideos();
        if (emit) {
            observer.emit(PlayerEventTypes.PAUSE);
        }
    }
    stop() {
        this.speed = 0;
        this.recordIndex = 0;
        this.frameIndex = 0;
        this.elapsedTime = 0;
        this.pause();
        this.audioNode.currentTime = 0;
        observer.emit(PlayerEventTypes.STOP);
    }
    execFrame(record) {
        const { isJumping, speed } = this;
        renderAll.call(this, record, { isJumping, speed });
    }
    calcFrames(maxInterval = this.maxFrameInterval) {
        if (this.options.mode === 'live') {
            return [];
        }
        const preTime = this.frames && this.frames[this.frameIndex];
        const { duration, startTime, endTime } = Store.getState().progress;
        this.frameInterval = Math.max(20, Math.min(maxInterval, (duration / 60 / 1000) * 60 - 40));
        const interval = this.frameInterval;
        const frames = [];
        let nextFrameIndex;
        for (let i = startTime; i < endTime + interval; i += interval) {
            frames.push(i);
            if (!nextFrameIndex && preTime && i >= preTime) {
                nextFrameIndex = frames.length - 1;
            }
        }
        frames.push(endTime);
        if (nextFrameIndex) {
            this.frameIndex = nextFrameIndex;
        }
        this.frames = frames;
    }
    calcHeatPointsData() {
        const frames = this.frames;
        if (!frames.length || !this.options.heatPoints) {
            return [];
        }
        const state = Store.getState();
        const { packs } = state.replayData;
        const { duration } = state.progress;
        const sliderWidth = this.progress.slider.offsetWidth;
        const column = Math.floor(sliderWidth / 7);
        const gap = duration / column;
        const heatPoints = packs.reduce((acc, records) => {
            let index = 0;
            let step = 0;
            let snapshot = false;
            const endTime = records.slice(-1)[0].time;
            let currentTime = records[0].time;
            while (currentTime < endTime && index < records.length) {
                const nextTime = currentTime + gap;
                const record = records[index];
                if (record.time < nextTime) {
                    index++;
                    step++;
                    if (isSnapshot(record)) {
                        snapshot = true;
                    }
                    continue;
                }
                acc.push({ step, snapshot });
                step = 0;
                snapshot = false;
                currentTime += gap;
            }
            return acc;
        }, []);
        return heatPoints;
    }
    orderRecords(records) {
        if (!records.length) {
            return [];
        }
        records.sort((a, b) => {
            return a.time - b.time;
        });
        return records;
    }
    recalculateProgress() {
        this.calcFrames();
        this.progress.drawHeatPoints(this.calcHeatPointsData());
    }
    processing(records) {
        return this.orderRecords(records);
    }
};
__decorate([
    ConnectProps(state => ({
        speed: state.player.speed
    }))
], PlayerComponent.prototype, "watchPlayerSpeed", null);
__decorate([
    ConnectProps(state => ({
        endTime: state.progress.endTime
    }))
], PlayerComponent.prototype, "watchProgress", null);
PlayerComponent = __decorate([
    Component('timecat-player', html `<div class="timecat-player">
        <iframe
            class="player-sandbox"
            sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
        ></iframe>
    </div>`)
], PlayerComponent);

let PointerComponent = class PointerComponent {
    constructor(c) {
        this.x = 0;
        this.y = 0;
        this.c = c;
        this.initPointer();
        this.togglePointer(true);
    }
    initPointer() {
        this.pointer = this.c.container.querySelector('.player-pointer');
    }
    togglePointer(show = !this.show) {
        this.show = show;
        this.pointer.firstElementChild.style.display = this.show ? 'inherit' : 'none';
    }
    hidePointer() {
        this.togglePointer((this.show = false));
    }
    move(x, y) {
        this.x = x;
        this.y = y;
        this.pointer.style.left = this.x + 'px';
        this.pointer.style.top = this.y + 'px';
    }
    click(x, y) {
        return __awaiter(this, void 0, void 0, function* () {
            this.move(x, y);
            if (this.pointer.hasAttribute('active')) {
                return;
            }
            yield delay(200);
            setAttribute(this.pointer, 'active', '');
            yield delay(400);
            setAttribute(this.pointer, 'active', null);
        });
    }
};
PointerComponent = __decorate([
    Component('player-pointer', html `<div class="player-pointer">
        <img
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAACACAQAAAAhBLbAAAAMkklEQVR42u2ceXAb5RXAfyvJh2xLcqw4dmQ7thPbOSGEOLJbjtIUBgi0wxSmMNNSoDTQMrRAIIUm8E+HuwfD0OkwPZgGUmiBNswUmvhIoBkIsS0DCTShSYAcxHYS27ItW7e0/UOr9a7sla3Tnqnfjjz77fft6uent+977+0BczInczInczInWRYBQf47a0RIqE+cadypoAXpI6KTgMXZgq2LiyyWFK4wEyIHPTp0s81MJkLrMEBx7WdtVzUAJozkYkA3m7EF9OSAYB4LiM6aYqCEQvJmN7YOPXkIwvxTvaJ4+COzBVhAEfnkzF5sAQNGcgTbqV5RFMXDn5hLgXJMsxdbQEcOheQL1af6RFEURfHTQ2YbAgsV2DMGrovTF0GX0JYu73rbXMkZishBj34mda0NLUgeRIZraHDsNlfJ2DOoa13cXkHdX1/vaLcs4ixF5Eh+ZEawp4KOwaqv69o989i6RHeoX9zVVlzDuZnEngp6EqD6JZ0tJTWytvXZx57KPCaV+iUdLdZaCVuffeyEzSMidYs7W621KgeYRfAEoN+lQ9FaXOtosy6O8dtZwk4A+gDNnFK0a2q62+cvmYnpJgFoG7CWHsWW6mpH+/y67E83Cdr0ORr5Uom9qLu9tI4zmLLpABM+EXu5BKeivajK0V7aQF82HWAS3uM4zTHYXa1lS2M8yWyDhiM0MaBoV1d1tpRHsHOzgZ2knz4ag72oqqvVtow+CrPht5OEhs+wq7ArK7tabcsl286w304aGj6nUYVtq3C02ZbThynT2ClAw3HW0q9oL7Q5dttW0Kuw7YxIStBwgkY1dnn3bttKFXYGwFOEhhOs45yiXV7W3VZxHr0UZg47ZWg4jp0zSuxyR2tlFDsj000aoOE4TfSpsLtaFp1Pb6amm7RAwwma6FVhd7ZUr6ZHZSRpA08TNJzErsIuK+9qrblAZdtpc4Bpg4YvaVRhly5wRLCL0o2dRmjoYa0K21rqaK9ZQw9F8imZFuy0QkNvTJpgtXa3166RTklDuqabNENDL40q7JKSfW/aooFrmhxg2qEj2MrsptzmaLXVpxM7A9DQi52TivbCqq7WijRiZwQaemnihKJtq+psrWpIV50kQ9DQh53jauyWRersJmlPkjFoOMs6FXZ5VVdL9bJ0YGcQGvpjsBdUOlqql9GXqt/OKDT006jCnl/haK1eoSo4JCEZhoaBWGybo616ZWp1koxDR7A/V2KXd7fVpISdBWgYwM5nira1zNFauyp57KxAwwBNHFVil3e1LF6likkSAM8SdAT7iAq7s6Xu/JhQaprYWYMGJ3b+G4Ndf0Ey5Z0sQsMwdpW255V17WpYLaUJCWg7q9AwwjoVtmVBZ0vDGnql+vY0/XaWoSPYSiOxlHa1NkSym2l7kqxDwwh2PlW0zdautoYLYzzJbIOOYB9SYpd0tSy9UJFLTnE/yYxAg4tmlZGYrZ0tyxvpoVBx7UYTfIagwcVlqgt8ZmvHrhWNKtvW9CQzBh1JE5TZjcna0bLKTg+mqRzgDEJPzG6KSjp2ntfEabl0qZsce0ahJ2Y3BSX7d53XLJ+SGrY9w9DQTy1tSuzijl3nNXMaE3laoZQhk0DzuZ1RgnHH5HCQ3Vyh2GK0dLTYr/pkPzZAIEgImMZdrgI6cjFhEVadOidK8g+RhJducToSFsMxW9zD538VgSrmUUBu7ISTYfO4Z1qjJpqt0dyxc/VXOCUVinXqUzLD0O/y1yT3zDd37FzTzJcUTLx1MU3QC5iv0fN40sfMM3/wzqVX0DPxtty0QFs5zcMafR/zvKIVCA6PESYkLWHVElIsQYIEyHvnxSY7ThlZAk+D97DSgYFbeJyzGrr+AbnSeo7h7pe2d9ZaQ34hRGjSu99FREJCEJ/gDYzUlrgMFEojhOjIlKEr2UcVUMxmNk864hS/YovcunXd9te/OEsQPwFChCdxZWFEQvjx4fnShQEjY+oBKZpHDR9SJa1volZj1NOKq7rfWHXLFZxDT5gQAfyTLAHJN+vJw4SAT/rX5H8vJeilOBQnoI6tGuOGeUrRevg6vZEBxhhhGCdOBlXLAIMM4mSYEUZx4yNISAIWU4a+kANYVVtuZ43G2GcVxZq6mnuv5CQB3LhwMRyzjEh/RxhlDA8+goTVZpQ09FreJ2/CVi1dB1S63nKzpRInIfx48eDGzZhicePGjQcPXvwECMinbGrQ63HIHkEp1/N1jT3+wEfyeknpz79DPzpEQgQJ4JvUtqPA4VibnlymiD3WxwYPofHgoU0zDrlBGVuMVl5COZUUY5SfolEvkZvOhcmivCQ0fQO7VW2X52vPvSMX6i7nOo39Xudted1YuOU23KonZ0RE1VQT3SaqTSMpTd8Yo2SPr+kxLrrl9+NbHJq6Vv1CwVVXMp9KisnHkFjdNAFNh4GbYwKgMW/jIx3vUb+ttVtOrtdym8YR9rBjvKHfupEQuXL2nYAkAH2CDbwYg2zf+p9uivFw5rG/jW/fqnkMZfh00/UXrcdJPoZEnwtLAPqWGC33j6y+/1A3ZgYZJG/Hzrf3R3uWcJ/GMRz8WdHaupEcDIk/E5YAtBWTonV2aO2mzw5ixomTIdw4H31pvHezaqxa12F5/eorr9lAP/lZqk/3Ou2bTx7FgpMhaRYr2tP299Zo/0Ie0NjzKM8qWg/fiQVBkZ1kDvrT3lU/PXEEE06GGMGFCxceAk+8MD7mfio19n4Sl7ze3Pz96+jHKD8PlqlS7+Ee+/2DpyjCKcUHkSl3DFP3vj+9Fh1VyM809j/LLxWth35MGSFypCkmM5o+cNL+gKuHIobkkMaPDx9ePBge3xb0R0f+hGUax/i14o6Q5SvuuokBjHK1NOUrARNmon1H19w32kchgxKyV4p/A/jxUvj5h79RnI5ars/NE4rWljsKa/FLdp0WTauw3zty8YPiEEacjOBiDC8BOasL4MdDwVMvj8h3hH+PJo3D/pbD8npF9aabccoxSHqvBLR+fPED4hB5kpbdeKUcIxI1RAJN4+DhJ7eN7/OI5tGU08yDd5Stwj39m2qn1rSk6ze7r7yX0QnIYTmyCBHEzxjFz7x6Ur6t5hqu0jjwduS5iMKSh27FRf50dT2VTUvIb+3/5j2EMDAg23IUOWJCYcJSZKz3nnhCoWvtKf0XivW7f7jYjkua0qd0fdrQ0o8u6OC1f117B2H0OHFJeZtfoWWkT8Su3cx7fscB+UrQxdyo8QU72SuvG/Ie2YhPCp+SvKEi+oytUVcnhvbuYSGruZg1NFCJlaJJHsUWENCTjwUbK6m86YHxGPTgpGHqInGb6FcFues2YKECM3lTXeHSa0ALkWm1oko/dPtDfiMFuKRpJJIdT6xXRGtAOgTMnxxZ31gtTYllnMGhGlrMs2xndcyXl1te2YFRSmOTEh0G8jHryvT5LGQZS1hEGfOkCwuT6UFAwEAeFhayjMrL7xzX4UkxR9Zwrvj4hMJuVL61ESOlFJEbP+rTa/YICAhiWMxHj09a/HINQpx0j+hHh+Xzo6uXLV8S6bDg4V0ANrGL9Ro8b+35S+vAgFRGn2aKFQsQ0XUhZoopxkyR5P7jWZuAnjzMlLGU6nXfHddhj2gWrxXPiVryxvv1G6mmgWUswCSV0eN8TRw9S5YdeWGGSAiRMPFSeQHQk0M+JiwMv/DMbd+OdIi4KNJwVTsP3P/y4b2EyWeYYUbxECAYT9dC3O1RnymCyr3FO1rkLQoFmAk3rDz8mi43znj+fWjTqx/sJUyBVG8aw42PgORONUQf54hK2OghprK0cR+iwzTwxbzS5gu0hnYdu+F3jz7f+wUmRCmWic4AU5QN4rtxde/0Tg1B1rUJYX7Nsdct5omDjpy+65Xd7fgw4WcMD268ePEpCsBxvi2eppOTqK4FdJjcJwxF62NCvb7Bjdt+9OwXBylEh0vKfNyylievWSeg6WSxIx7biAlDvvXYqxUV0a5R95Ydz73BGcyEGcONF49UyQvKwFPW7dKvabW/Lgie9uVuuBQgFHjynxuefr8dHfmMMoJLSta8Ch0zNXKmHr6LRCK5GCkil5xjbyyp++POza8MHcOMgTE8qkJuQK7eTfP9Q5mD1mEglwLM+K6+LGBpb8OKCQ9eCdhHQEoiEgLOJHT0VT15GLEwgoEKkDLJqDkEkgHOHHTkyDoJO488cqUSekACDsrF8iReSZXJuxBEwgSBMEG8CCBd1EwJOBvQkRk1KIUdkeuyKQFDZl+5EH3/23iqKsakaCkcOJMiKD7KEy6lF6tl/s0Fsd8wK94DNydzMif/n/I/5OjlEWH8JT8AAAAASUVORK5CYII="
            alt="pointer"
        />
        <div class="spinner"></div>
    </div>`)
], PointerComponent);

let ProgressComponent = class ProgressComponent {
    constructor(options, c) {
        this.heatPoints = [];
        this.findProgressByPosition = (() => {
            const cacheMap = new Map();
            return function (percent) {
                const result = cacheMap.get(percent);
                if (result) {
                    return result;
                }
                const { startTime, duration, packsInfo } = Store.getState().progress;
                const { packs } = Store.getState().replayData;
                const time = startTime + duration * percent;
                const index = packsInfo.findIndex(pack => {
                    const { startTime, endTime, diffTime } = pack;
                    if (startTime - diffTime <= time && endTime - diffTime >= time) {
                        return true;
                    }
                });
                if (index !== undefined) {
                    const records = packs[index];
                    const packInfo = packsInfo[index];
                    const { startTime, diffTime } = packInfo;
                    const totalDurationTime = packsInfo.reduce((acc, info) => acc + info.duration, 0);
                    const beforeDurationTime = packsInfo.slice(0, index).reduce((acc, info) => acc + info.duration, 0);
                    for (let i = 0; i < records.length; i++) {
                        const cur = records[i];
                        const next = records[i + 1];
                        if (next) {
                            if (time >= cur.time - diffTime && time <= next.time - diffTime) {
                                const reviseTime = totalDurationTime * percent - (cur.time - startTime) - beforeDurationTime;
                                const time = cur.time - diffTime + reviseTime;
                                const data = { index, percent, time };
                                cacheMap.set(percent, data);
                                return data;
                            }
                        }
                    }
                }
                return null;
            };
        })();
        this.listenElementOnHover = (target) => stateDebounce(setState => {
            const stateIn = () => setState('in');
            const stateOut = () => setState('out');
            target.addEventListener('mouseover', stateIn, false);
            target.addEventListener('mouseout', stateOut, false);
            this.options.destroyStore.add(() => {
                target.removeEventListener('mouseover', stateIn, false);
                target.removeEventListener('mouseout', stateOut, false);
            });
        }, state => (state === 'in' ? 200 : 1000), 'out');
        this.options = options;
        this.c = c;
        this.progress = c.container.querySelector('.player-progress');
        this.progress = c.container.querySelector('.player-progress');
        this.timer = c.container.querySelector('.player-timer');
        this.currentProgress = this.progress.querySelector('.player-current-progress');
        this.slider = this.progress.querySelector('.player-slider-bar');
        this.heatBar = this.progress.querySelector('.player-heat-bar');
        this.thumb = this.progress.querySelector('.player-thumb');
        this.listenElementOnHover(this.parent)(state => {
            if (state === 'in') {
                this.thumb.setAttribute('active', '');
                return;
            }
            this.thumb.removeAttribute('active');
        });
        const handle = (e) => {
            const { left, width: sliderWidth } = this.slider.getBoundingClientRect();
            const width = Math.max(0, Math.min(e.x - left, sliderWidth));
            const percent = +(width / sliderWidth).toFixed(3);
            const progress = this.findProgressByPosition(percent);
            observer.emit(PlayerEventTypes.JUMP, progress);
        };
        this.progress.addEventListener('click', handle, false);
        this.options.destroyStore.add(() => {
            this.progress.removeEventListener('click', handle, false);
        });
    }
    updateTimer(frameIndex, frameInterval, curViewDiffTime) {
        const c = this.c.options;
        const { timeMode } = c;
        const seconds = (frameIndex + 1) * frameInterval;
        let time;
        if (timeMode === 'durationTime') {
            time = secondToTime(seconds / 1000);
        }
        else {
            const { startTime } = Store.getState().progress;
            const timestamp = startTime + seconds + curViewDiffTime;
            time = getDateTime(timestamp);
        }
        if (time !== this.timer.innerText) {
            this.timer.innerText = time;
        }
    }
    moveThumb(percent = 0) {
        const left = percent * this.slider.offsetWidth;
        this.currentProgress.style.width = left + 'px';
    }
    drawHeatPoints(points) {
        if (points) {
            if (isPointsEqual(this.heatPoints, points)) {
                return;
            }
            this.heatPoints = points;
        }
        else if (this.heatPoints.length) {
            return;
        }
        if (this.heatPoints.length) {
            new Pillar(this.heatBar, this.heatPoints);
        }
        else {
            new NormalLine(this.heatBar);
        }
        function isPointsEqual(a, b) {
            if (a.length !== b.length) {
                return false;
            }
            for (let i = 0; i < a.length; i++) {
                const itemA = a[i];
                const itemB = b[i];
                if (itemA.step !== itemB.step || itemA.snapshot !== itemB.snapshot) {
                    return false;
                }
            }
            return true;
        }
    }
    setProgressPosition(percent) {
        this.currentProgress.style.width = this.slider.offsetWidth * percent + 'px';
    }
};
ProgressComponent = __decorate([
    Component('player-progress', html `<div class="player-progress">
        <div class="player-timer">00:00</div>
        <div class="player-slider-bar">
            <div class="player-heat-bar-container">
                <canvas class="player-heat-bar"></canvas>
            </div>
            <div class="player-current-progress">
                <div class="player-thumb"></div>
            </div>
        </div>
    </div>`)
], ProgressComponent);

let BroadcasterComponent = class BroadcasterComponent {
    constructor(container) {
        this.c = container;
        this.init();
    }
    init() {
        this.broadcaster = this.c.container.querySelector('.player-broadcaster');
        this.floatLayer = this.broadcaster.firstElementChild;
        this.subtitle = this.floatLayer.firstElementChild;
    }
    updateText(text) {
        text = text.trim();
        if (this.subtitle.innerText.trim() === text) {
            return;
        }
        this.subtitle.innerText = text;
        this.floatLayer.toggleAttribute('hidden', !text);
    }
    cleanText() {
        this.updateText('');
    }
};
BroadcasterComponent = __decorate([
    Component('player-broadcaster', html `<div class="player-broadcaster">
        <div class="float-layer" hidden>
            <span class="subtitle"></span>
        </div>
    </div>`)
], BroadcasterComponent);

let ToolboxComponent = class ToolboxComponent {
    constructor(options, c) {
        this.options = options;
        this.c = c;
        this.exportBtn = this.target.querySelector('.player-export');
        this.exportBtn.addEventListener('click', this.export);
        this.fullscreenBtn = this.target.querySelector('.player-fullscreen');
        this.fullscreenTarget = this.c.container.parentNode.host.parentElement;
        this.fullscreenTarget.addEventListener('fullscreenchange', () => this.cancelFullScreen());
        this.fullscreenBtn.addEventListener('click', () => this.setFullScreen());
        this.options.destroyStore.add(() => {
            this.exportBtn.removeEventListener('click', this.export);
            this.fullscreenTarget.removeEventListener('fullscreenchange', () => this.cancelFullScreen());
            this.fullscreenBtn.removeEventListener('click', () => this.setFullScreen());
        });
    }
    export() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    setFullScreen() {
        this.c.resize({ maxScale: 100 });
        this.fullscreenTarget.requestFullscreen().catch(msg => {
            logError(msg);
            logAdvice('If the Player within the iframe, you should be set the attribute: allowfullscreen');
        });
    }
    cancelFullScreen() {
        if (document.fullscreen) {
            return;
        }
        this.c.resize({ maxScale: 0 });
    }
};
ToolboxComponent = __decorate([
    Component('player-toolbox', html `<div class="player-toolbox">
        <div class="player-export">
            <button type="button">
                <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    width="16px"
                    height="16px"
                    viewBox="0 0 511.994 511.994"
                    style="enable-background:new 0 0 511.994 511.994;"
                    xml:space="preserve"
                >
                    <path
                        style="fill:#fff;"
                        d="M403.079,310.458c-3.627-7.232-11.008-11.797-19.093-11.797h-64v-85.333c0-11.776-9.536-21.333-21.333-21.333H213.32
            c-11.776,0-21.333,9.557-21.333,21.333v85.333h-64c-8.064,0-15.445,4.565-19.072,11.797c-3.605,7.232-2.837,15.872,2.027,22.336
            l128,170.667c4.011,5.376,10.347,8.533,17.045,8.533c6.72,0,13.056-3.157,17.067-8.533l128-170.667
            C405.917,326.33,406.685,317.69,403.079,310.458z"
                    />
                    <path
                        style="fill:#fff;"
                        d="M298.663,128.001H213.33c-11.797,0-21.333,9.536-21.333,21.333c0,11.797,9.536,21.333,21.333,21.333h85.333
                        c11.797,0,21.333-9.536,21.333-21.333C319.996,137.537,310.46,128.001,298.663,128.001z"
                    />
                    <path
                        style="fill:#fff;"
                        d="M298.663,64.001H213.33c-11.797,0-21.333,9.536-21.333,21.333s9.536,21.333,21.333,21.333h85.333
                        c11.797,0,21.333-9.536,21.333-21.333S310.46,64.001,298.663,64.001z"
                    />
                </svg>
            </button>
        </div>
        <div class="player-fullscreen">
            <svg
                version="1.1"
                id="Capa_1"
                width="16px"
                height="16px"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                x="0px"
                y="0px"
                viewBox="0 0 469.333 469.333"
                style="enable-background:new 0 0 469.333 469.333;"
                xml:space="preserve"
            >
                <path
                    style="fill:#fff;"
                    d="M160,0H10.667C4.771,0,0,4.771,0,10.667V160c0,5.896,4.771,10.667,10.667,10.667H32c5.896,0,10.667-4.771,10.667-10.667
                V42.667H160c5.896,0,10.667-4.771,10.667-10.667V10.667C170.667,4.771,165.896,0,160,0z"
                />
                <path
                    style="fill:#fff;"
                    d="M458.667,0H309.333c-5.896,0-10.667,4.771-10.667,10.667V32c0,5.896,4.771,10.667,10.667,10.667h117.333V160
                c0,5.896,4.771,10.667,10.667,10.667h21.333c5.896,0,10.667-4.771,10.667-10.667V10.667C469.333,4.771,464.563,0,458.667,0z"
                />
                <path
                    style="fill:#fff;"
                    d="M458.667,298.667h-21.333c-5.896,0-10.667,4.771-10.667,10.667v117.333H309.333c-5.896,0-10.667,4.771-10.667,10.667
                v21.333c0,5.896,4.771,10.667,10.667,10.667h149.333c5.896,0,10.667-4.771,10.667-10.667V309.333
                C469.333,303.437,464.563,298.667,458.667,298.667z"
                />
                <path
                    style="fill:#fff;"
                    d="M160,426.667H42.667V309.333c0-5.896-4.771-10.667-10.667-10.667H10.667C4.771,298.667,0,303.437,0,309.333v149.333
                c0,5.896,4.771,10.667,10.667,10.667H160c5.896,0,10.667-4.771,10.667-10.667v-21.333
                C170.667,431.438,165.896,426.667,160,426.667z"
                />
            </svg>
        </div>
    </div>`)
], ToolboxComponent);

let PanelComponent = class PanelComponent {
    constructor(c) {
        this.c = c;
        this.options = c.options;
        this.initComponent();
    }
    initComponent() {
        new ToolboxComponent(this.options, this.c);
        this.keyboard = new KeyboardComponent(this.options, this.c);
        this.progress = new ProgressComponent(this.options, this.c);
        this.pointer = new PointerComponent(this.c);
        this.broadcaster = new BroadcasterComponent(this.c);
        this.player = new PlayerComponent(this.options, this.c, this.pointer, this.progress, this.broadcaster);
    }
};
PanelComponent = __decorate([
    Component('player-panel', html `<div class="player-panel">
        <slot></slot>
    </div>`)
], PanelComponent);

let PageStartComponent = class PageStartComponent {
    constructor() {
        setTimeout(() => { });
    }
};
PageStartComponent = __decorate([
    Component('player-start-page', html `<div class="player-start-page" style="display: none;">
        <div class="play-btn">
            <svg
                version="1.1"
                id="Capa_1"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                x="0px"
                y="0px"
                viewBox="0 0 142.448 142.448"
                style="enable-background:new 0 0 142.448 142.448;"
                xml:space="preserve"
            >
                <g>
                    <path
                        style="fill:#bbb;"
                        d="M142.411,68.9C141.216,31.48,110.968,1.233,73.549,0.038c-20.361-0.646-39.41,7.104-53.488,21.639
        C6.527,35.65-0.584,54.071,0.038,73.549c1.194,37.419,31.442,67.667,68.861,68.861c0.779,0.025,1.551,0.037,2.325,0.037
        c19.454,0,37.624-7.698,51.163-21.676C135.921,106.799,143.033,88.377,142.411,68.9z M111.613,110.336
        c-10.688,11.035-25.032,17.112-40.389,17.112c-0.614,0-1.228-0.01-1.847-0.029c-29.532-0.943-53.404-24.815-54.348-54.348
        c-0.491-15.382,5.122-29.928,15.806-40.958c10.688-11.035,25.032-17.112,40.389-17.112c0.614,0,1.228,0.01,1.847,0.029
        c29.532,0.943,53.404,24.815,54.348,54.348C127.91,84.76,122.296,99.306,111.613,110.336z"
                    />
                    <path
                        style="fill:#bbb;"
                        d="M94.585,67.086L63.001,44.44c-3.369-2.416-8.059-0.008-8.059,4.138v45.293
        c0,4.146,4.69,6.554,8.059,4.138l31.583-22.647C97.418,73.331,97.418,69.118,94.585,67.086z"
                    />
                </g>
            </svg>
        </div>
    </div>`)
], PageStartComponent);

var HTML = "<div class=\"player-container\">\n    <timecat-player></timecat-player>\n    <player-panel>\n        <player-broadcaster></player-broadcaster>\n        <player-keyboard></player-keyboard>\n        <player-progress></player-progress>\n        <player-toolbox></player-toolbox>\n    </player-panel>\n    <player-start-page></player-start-page>\n    <player-pointer></player-pointer>\n</div>\n";

var CSS = "/**\n * Copyright (c) oct16.\n * https://github.com/oct16\n * \n * This source code is licensed under the GPL-3.0 license found in the\n * LICENSE file in the root directory of this source tree.\n *\n */\nbody {\n  margin: 0;\n  background-color: #e2e2e2;\n  overflow: hidden; }\n\n.player-main {\n  box-shadow: 0px 0px 5px rgba(26, 26, 26, 0.05);\n  transition: all .5s;\n  -webkit-transition: all .5s;\n  opacity: 0;\n  position: relative;\n  overflow: visible; }\n\n.player-sandbox {\n  background: white;\n  vertical-align: top;\n  border: 0;\n  width: 100%;\n  height: 100%; }\n\n.timecat-player {\n  position: relative;\n  width: inherit;\n  height: inherit; }\n\n.player-pointer {\n  width: 10px;\n  height: 10px;\n  position: absolute;\n  transition: all .2s; }\n  .player-pointer img {\n    width: 15px;\n    position: absolute;\n    z-index: 100;\n    top: -5px;\n    left: -3px; }\n  .player-pointer[active] .spinner {\n    width: 32px;\n    height: 32px;\n    left: -17px;\n    top: -18px;\n    position: absolute;\n    background-color: #333;\n    border-radius: 100%;\n    -webkit-animation: spinner-scale .4s 1 ease-in-out;\n    animation: spinner-scale .4s 1 ease-in-out; }\n\n@-webkit-keyframes spinner-scale {\n  0% {\n    -webkit-transform: scale(0); }\n  100% {\n    -webkit-transform: scale(1);\n    opacity: 0.2; } }\n\n@keyframes spinner-scale {\n  0% {\n    -webkit-transform: scale(0);\n    transform: scale(0); }\n  100% {\n    -webkit-transform: scale(1);\n    transform: scale(1);\n    opacity: 0.2; } }\n\n.player-container {\n  background: grey; }\n\n.player-panel {\n  width: 100%;\n  box-sizing: border-box;\n  padding: 5px 10px;\n  height: 40px;\n  position: absolute;\n  left: 0;\n  bottom: -41px;\n  background: black;\n  opacity: 0.8;\n  display: flex;\n  user-select: none; }\n\n.player-broadcaster {\n  position: absolute;\n  width: 100%;\n  left: 0;\n  bottom: 50px;\n  display: flex;\n  justify-content: center; }\n  .player-broadcaster .float-layer {\n    margin: 0 10px;\n    line-height: 20px;\n    color: #fff;\n    background-color: rgba(0, 0, 0, 0.6);\n    border-radius: 2px;\n    padding: 5px;\n    box-shadow: 0px 0px 2px rgba(26, 26, 26, 0.5);\n    text-align: center; }\n    .player-broadcaster .float-layer[hidden] {\n      display: none; }\n\n.player-keyboard {\n  white-space: nowrap; }\n  .player-keyboard button[disabled] {\n    cursor: default;\n    color: #999; }\n\n.player-export button,\n.player-keyboard button {\n  border: none;\n  background: none;\n  color: white;\n  outline: none;\n  cursor: pointer;\n  font-size: 14px;\n  padding: 0 5px; }\n  .player-export button.play-or-pause,\n  .player-keyboard button.play-or-pause {\n    padding: 0;\n    text-indent: 1px;\n    transform: rotate(90deg);\n    width: 18px; }\n\n.player-progress,\n.player-keyboard,\n.player-toolbox,\n.player-timer {\n  display: flex;\n  align-items: center; }\n\n.player-export {\n  display: flex; }\n  .player-export button {\n    padding: 2px 0 0 0;\n    padding-left: 2px; }\n\n.player-fullscreen {\n  margin-left: 8px;\n  cursor: pointer;\n  display: flex; }\n\n.player-progress {\n  width: 100%;\n  cursor: pointer; }\n  .player-progress .player-timer {\n    margin-left: 2px;\n    padding: 0 4px;\n    color: white;\n    font-size: 14px;\n    font-family: Helvetica; }\n\n.player-slider-bar {\n  position: relative;\n  width: calc(100% - 20px);\n  height: 23px;\n  margin: 7.5px 8px;\n  border-radius: 2.5px; }\n\n.player-heat-bar-container {\n  height: 100%;\n  width: 100%;\n  position: absolute;\n  overflow: hidden;\n  background: black; }\n\n.player-heat-bar {\n  height: 16px;\n  width: 100%;\n  position: absolute;\n  left: 0;\n  top: 0;\n  margin: 2px 0px 0 0px;\n  background: black;\n  transform: rotateZ(180deg) rotateY(180deg); }\n\n.player-thumb {\n  width: 2px;\n  border: 1px solid white;\n  border-radius: 1px;\n  height: 95%;\n  background: #fff;\n  cursor: pointer;\n  position: absolute;\n  right: 0px;\n  top: 0;\n  z-index: 10;\n  transition: all .3s;\n  box-shadow: 0px 0px 5px black; }\n  .player-thumb[active] {\n    background: red;\n    border-color: red; }\n\n.player-current-progress {\n  position: absolute;\n  left: 0;\n  top: 0;\n  width: 0;\n  height: 100%; }\n\n.player-start-page {\n  position: absolute;\n  left: 0;\n  top: 0;\n  width: 100%;\n  height: calc(100% + 42px);\n  -webkit-backdrop-filter: blur(1.5px);\n  backdrop-filter: blur(1.5px);\n  transition: .5s all;\n  cursor: pointer; }\n  .player-start-page .play-btn {\n    position: absolute;\n    margin: auto;\n    left: 0;\n    top: 0;\n    right: 0;\n    bottom: 0;\n    width: 100px;\n    height: 100px;\n    transition: all .5s;\n    transform: scale(0);\n    opacity: 0; }\n    .player-start-page .play-btn.show {\n      transform: scale(1);\n      opacity: 1; }\n";

class ContainerComponent {
    constructor(options) {
        this.options = options;
        this.init();
    }
    init() {
        const target = this.options.target;
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        this.target = targetElement;
        this.initTemplate();
        this.initSandbox();
        const { resize } = this.makeItResponsive();
        this.resize = resize;
        this.initPanel();
    }
    initPanel() {
        this.panel = new PanelComponent(this);
        new PageStartComponent();
    }
    initSandbox() {
        this.sandBox = this.container.querySelector('.player-sandbox');
        this.sandBoxDoc = this.sandBox.contentDocument;
        this.setSmoothScroll(this.sandBox.contentWindow);
        createIframeDOM(this.sandBoxDoc, this.getSnapshotRecord());
        if (this.options.disableScrolling) {
            disableScrolling(this.sandBox.contentWindow.document);
        }
        this.setViewState();
    }
    getSnapshotRecord() {
        return Store.getState().replayData.currentData.snapshot.data;
    }
    setSmoothScroll(context) {
        smoothScroll.polyfill();
        context.HTMLElement.prototype.scroll = window.scroll;
        context.HTMLElement.prototype.scrollTo = window.scrollTo;
    }
    setViewState() {
        nodeStore.reset();
        const recordData = this.getSnapshotRecord();
        const { pathname, hash, href } = createURL(recordData.href);
        const doc = this.sandBoxDoc;
        const context = doc.defaultView;
        context.G_REPLAY_LOCATION = Object.assign(Object.assign({}, (context.G_REPLAY_LOCATION || {})), { path: pathname, hash, href });
        injectIframeContent(this.sandBoxDoc, recordData);
    }
    initTemplate() {
        const targetElement = this.target instanceof Window ? this.target.document.body : this.target;
        const shadowHost = parseHtmlStr(html `<div class="player-shadowhost"></div>`)[0];
        targetElement.appendChild(shadowHost);
        const shadow = shadowHost.attachShadow({ mode: 'open' });
        shadow.appendChild(this.createStyle('player-css', CSS));
        shadow.appendChild(this.createContainer('player-main', HTML));
        this.shadowHost = shadowHost;
    }
    createContainer(className, html) {
        const parser = new DOMParser();
        const el = parser.parseFromString(html, 'text/html').body.firstChild;
        el.className = className;
        el.style.width = this.getSnapshotRecord().width + 'px';
        el.style.height = this.getSnapshotRecord().height + 'px';
        el.style.display = 'none';
        return (this.container = el);
    }
    makeItResponsive() {
        const self = this;
        const debounceResizeFn = debounce(resizeHandle, 500);
        const callbackFn = () => debounceResizeFn({ target: self.target });
        window.addEventListener('resize', callbackFn, true);
        this.options.destroyStore.add(() => window.removeEventListener('resize', callbackFn, true));
        setTimeout(() => (this.container.style.opacity = '1'));
        this.container.style.display = 'block';
        let lockScale = 0;
        triggerResize();
        function triggerResize(options) {
            const { setHeight, setWidth, maxScale } = options || {};
            resizeHandle({ target: self.target }, setWidth, setHeight, maxScale);
        }
        function resizeHandle(e, setWidth, setHeight, maxScale = 1) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!e) {
                    return;
                }
                const { width: targetWidth, height: targetHeight } = getPageSize(self.container);
                setWidth = setWidth || targetWidth;
                setHeight = setHeight || targetHeight;
                switch (maxScale) {
                    case 0:
                        lockScale = 0;
                        break;
                    case 100:
                        lockScale = 100;
                        break;
                }
                const setMaxScale = lockScale || maxScale;
                if (e.target instanceof Window) {
                    const { innerWidth: w, innerHeight: h } = e.target;
                    scalePages(self.container, w, h, setWidth, setHeight, setMaxScale);
                }
                else {
                    const { offsetWidth: w, offsetHeight: h } = e.target;
                    scalePages(self.container, w, h, setWidth, setHeight, setMaxScale);
                }
            });
        }
        function scalePages(target, maxWidth, maxHeight, setWidth, setHeight, setMaxScale) {
            const { mode: replayMode } = Store.getState().player.options || {};
            const panelHeight = replayMode === 'live' ? 0 : 40 - 2;
            const scaleX = maxWidth / setWidth;
            const scaleY = maxHeight / (setHeight + panelHeight);
            const scale = Math.min(scaleX > scaleY ? scaleY : scaleX, setMaxScale || 1);
            const left = (setWidth * scale - setWidth) / 2 + (maxWidth - setWidth * scale) / 2;
            const top = (maxHeight - setHeight - panelHeight * scale) / 2;
            target.style.transform = `scale(${scale})`;
            target.style.left = left + 'px';
            target.style.top = top + 'px';
            const currentWidth = parseInt(target.style.width);
            const currentHeight = parseInt(target.style.height);
            if (setWidth !== currentWidth || setHeight !== currentHeight) {
                target.style.width = setWidth + 'px';
                target.style.height = setHeight + 'px';
                observer.emit(PlayerEventTypes.RESIZE);
            }
        }
        function getPageSize(target) {
            return {
                width: parseInt(target.style.width, 10),
                height: parseInt(target.style.height, 10)
            };
        }
        return {
            resize: triggerResize
        };
    }
    createStyle(id, s) {
        const style = document.createElement('style');
        style.id = id;
        style.innerHTML = s;
        return style;
    }
}

const defaultReplayOptions = {
    autoplay: true,
    mode: 'default',
    target: window,
    heatPoints: true,
    timeMode: 'durationTime',
    fastForward: [2, 8],
    disableScrolling: true
};
class Player {
    constructor(options) {
        this.on = tempEmptyFn;
        this.destroy = tempEmptyFn;
        this.append = tempEmptyFn;
        const player = new PlayerModule(options);
        Object.keys(this).forEach((key) => (this[key] = player[key].bind(player)));
    }
}
class PlayerModule {
    constructor(options) {
        this.destroyStore = new Set();
        this.triggerCalcProgress = debounce(() => this.calcProgress(), 500);
        nodeStore.reset();
        this.init(options);
    }
    init(options) {
        return __awaiter(this, void 0, void 0, function* () {
            {
                logInfo();
            }
            const opts = Object.assign(Object.assign({ destroyStore: this.destroyStore }, defaultReplayOptions), options);
            this.options = opts;
            Store.dispatch({ type: PlayerReducerTypes.OPTIONS, data: { options: opts } });
            this.destroyStore.add(() => Store.unsubscribe());
            const records = yield this.getRecords(opts);
            window.G_REPLAY_RECORDS = records;
            const packs = getPacks(records);
            const firstData = transToReplayData(packs[0]);
            const { audio } = firstData;
            Store.dispatch({
                type: ReplayDataReducerTypes.UPDATE_DATA,
                data: { records, packs, currentData: firstData }
            });
            const hasAudio = audio && (audio.src || audio.wavStrList.length || audio.pcmStrList.length);
            this.c = new ContainerComponent(opts);
            const container = this.c.container;
            showStartMask(this.c);
            (this.fmp = new FMP()).ready(() => __awaiter(this, void 0, void 0, function* () {
                if (hasAudio) {
                    yield waitStart(container);
                }
                removeStartPage(container);
                if (records.length) {
                    if (opts.autoplay || hasAudio) {
                        if (opts.autoplay) {
                            Store.dispatch({
                                type: PlayerReducerTypes.SPEED,
                                data: { speed: 1 }
                            });
                        }
                    }
                }
            }));
            if (packs.length) {
                this.calcProgress();
            }
            if (records.length <= 2) {
                Store.dispatch({ type: PlayerReducerTypes.OPTIONS, data: { options: { mode: 'live' } } });
                const panel = this.c.panel.target;
                if (panel) {
                    panel.setAttribute('style', 'display: none');
                }
            }
        });
    }
    getRecords(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { receiver, records: recordsData } = options;
            const records = recordsData || (receiver && (yield this.dataReceiver(receiver)));
            if (!records) {
                throw logError('Replay data not found');
            }
            return records;
        });
    }
    calcProgress() {
        const { packs } = Store.getState().replayData;
        const startTime = packs[0][0].time;
        let duration = 0;
        const packsInfo = [];
        let diffTime = 0;
        packs.forEach((pack, index) => {
            const startTime = pack[0].time;
            const endTime = pack.slice(-1)[0].time;
            if (index) {
                diffTime += startTime - packs[index - 1].slice(-1)[0].time;
            }
            const info = {
                startTime,
                endTime,
                duration: endTime - startTime,
                diffTime
            };
            packsInfo.push(info);
            duration += info.duration;
        });
        const endTime = startTime + duration;
        Store.dispatch({
            type: ProgressReducerTypes.PROGRESS,
            data: {
                duration,
                packsInfo,
                startTime,
                endTime
            }
        });
    }
    dispatchEvent(type, data) {
        const event = new CustomEvent(type, { detail: data });
        window.dispatchEvent(event);
    }
    dataReceiver(receiver) {
        return __awaiter(this, void 0, void 0, function* () {
            let isResolved;
            let head;
            let snapshot;
            return yield new Promise(resolve => {
                receiver(data => {
                    if (isResolved) {
                        this.dispatchEvent('record-data', data);
                    }
                    else {
                        if (data.type === RecordType.HEAD) {
                            head = data;
                        }
                        else if (data.type === RecordType.SNAPSHOT) {
                            snapshot = data;
                        }
                        if (head && snapshot) {
                            isResolved = true;
                            resolve([head, snapshot]);
                            this.dispatchEvent('record-data', data);
                        }
                    }
                });
            });
        });
    }
    destroy(opts = { removeDOM: true }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.destroyStore.forEach(un => un());
            observer.destroy();
            Store.unsubscribe();
            yield delay(0);
            removeGlobalVariables();
            if (opts.removeDOM) {
                const shadowHost = this.c.shadowHost;
                (_a = this.c.shadowHost.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(shadowHost);
            }
        });
    }
    on(key, fn) {
        observer.on(key, fn);
    }
    append(records) {
        return __awaiter(this, void 0, void 0, function* () {
            yield delay(0);
            Store.dispatch({
                type: ReplayDataReducerTypes.APPEND_RECORDS,
                data: { records }
            });
            this.triggerCalcProgress();
        });
    }
}

export { Player, PlayerModule };
//# sourceMappingURL=xreplay-player.esm.js.map

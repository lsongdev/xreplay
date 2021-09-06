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

function Diff() {}
Diff.prototype = {
  diff: function diff(oldString, newString) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var callback = options.callback;

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    this.options = options;
    var self = this;

    function done(value) {
      if (callback) {
        setTimeout(function () {
          callback(undefined, value);
        }, 0);
        return true;
      } else {
        return value;
      }
    } // Allow subclasses to massage the input prior to running


    oldString = this.castInput(oldString);
    newString = this.castInput(newString);
    oldString = this.removeEmpty(this.tokenize(oldString));
    newString = this.removeEmpty(this.tokenize(newString));
    var newLen = newString.length,
        oldLen = oldString.length;
    var editLength = 1;
    var maxEditLength = newLen + oldLen;
    var bestPath = [{
      newPos: -1,
      components: []
    }]; // Seed editLength = 0, i.e. the content starts with the same values

    var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);

    if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
      // Identity per the equality and tokenizer
      return done([{
        value: this.join(newString),
        count: newString.length
      }]);
    } // Main worker method. checks all permutations of a given edit length for acceptance.


    function execEditLength() {
      for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
        var basePath = void 0;

        var addPath = bestPath[diagonalPath - 1],
            removePath = bestPath[diagonalPath + 1],
            _oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;

        if (addPath) {
          // No one else is going to attempt to use this value, clear it
          bestPath[diagonalPath - 1] = undefined;
        }

        var canAdd = addPath && addPath.newPos + 1 < newLen,
            canRemove = removePath && 0 <= _oldPos && _oldPos < oldLen;

        if (!canAdd && !canRemove) {
          // If this path is a terminal then prune
          bestPath[diagonalPath] = undefined;
          continue;
        } // Select the diagonal that we want to branch from. We select the prior
        // path whose position in the new string is the farthest from the origin
        // and does not pass the bounds of the diff graph


        if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
          basePath = clonePath(removePath);
          self.pushComponent(basePath.components, undefined, true);
        } else {
          basePath = addPath; // No need to clone, we've pulled it from the list

          basePath.newPos++;
          self.pushComponent(basePath.components, true, undefined);
        }

        _oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath); // If we have hit the end of both strings, then we are done

        if (basePath.newPos + 1 >= newLen && _oldPos + 1 >= oldLen) {
          return done(buildValues(self, basePath.components, newString, oldString, self.useLongestToken));
        } else {
          // Otherwise track this path as a potential candidate and continue.
          bestPath[diagonalPath] = basePath;
        }
      }

      editLength++;
    } // Performs the length of edit iteration. Is a bit fugly as this has to support the
    // sync and async mode which is never fun. Loops over execEditLength until a value
    // is produced.


    if (callback) {
      (function exec() {
        setTimeout(function () {
          // This should not happen, but we want to be safe.

          /* istanbul ignore next */
          if (editLength > maxEditLength) {
            return callback();
          }

          if (!execEditLength()) {
            exec();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength) {
        var ret = execEditLength();

        if (ret) {
          return ret;
        }
      }
    }
  },
  pushComponent: function pushComponent(components, added, removed) {
    var last = components[components.length - 1];

    if (last && last.added === added && last.removed === removed) {
      // We need to clone here as the component clone operation is just
      // as shallow array clone
      components[components.length - 1] = {
        count: last.count + 1,
        added: added,
        removed: removed
      };
    } else {
      components.push({
        count: 1,
        added: added,
        removed: removed
      });
    }
  },
  extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
    var newLen = newString.length,
        oldLen = oldString.length,
        newPos = basePath.newPos,
        oldPos = newPos - diagonalPath,
        commonCount = 0;

    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
      newPos++;
      oldPos++;
      commonCount++;
    }

    if (commonCount) {
      basePath.components.push({
        count: commonCount
      });
    }

    basePath.newPos = newPos;
    return oldPos;
  },
  equals: function equals(left, right) {
    if (this.options.comparator) {
      return this.options.comparator(left, right);
    } else {
      return left === right || this.options.ignoreCase && left.toLowerCase() === right.toLowerCase();
    }
  },
  removeEmpty: function removeEmpty(array) {
    var ret = [];

    for (var i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }

    return ret;
  },
  castInput: function castInput(value) {
    return value;
  },
  tokenize: function tokenize(value) {
    return value.split('');
  },
  join: function join(chars) {
    return chars.join('');
  }
};

function buildValues(diff, components, newString, oldString, useLongestToken) {
  var componentPos = 0,
      componentLen = components.length,
      newPos = 0,
      oldPos = 0;

  for (; componentPos < componentLen; componentPos++) {
    var component = components[componentPos];

    if (!component.removed) {
      if (!component.added && useLongestToken) {
        var value = newString.slice(newPos, newPos + component.count);
        value = value.map(function (value, i) {
          var oldValue = oldString[oldPos + i];
          return oldValue.length > value.length ? oldValue : value;
        });
        component.value = diff.join(value);
      } else {
        component.value = diff.join(newString.slice(newPos, newPos + component.count));
      }

      newPos += component.count; // Common case

      if (!component.added) {
        oldPos += component.count;
      }
    } else {
      component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
      oldPos += component.count; // Reverse add and remove so removes are output first to match common convention
      // The diffing algorithm is tied to add then remove output and this is the simplest
      // route to get the desired output with minimal overhead.

      if (componentPos && components[componentPos - 1].added) {
        var tmp = components[componentPos - 1];
        components[componentPos - 1] = components[componentPos];
        components[componentPos] = tmp;
      }
    }
  } // Special case handle for when one terminal is ignored (i.e. whitespace).
  // For this case we merge the terminal into the prior string and drop the change.
  // This is only available for string mode.


  var lastComponent = components[componentLen - 1];

  if (componentLen > 1 && typeof lastComponent.value === 'string' && (lastComponent.added || lastComponent.removed) && diff.equals('', lastComponent.value)) {
    components[componentLen - 2].value += lastComponent.value;
    components.pop();
  }

  return components;
}

function clonePath(path) {
  return {
    newPos: path.newPos,
    components: path.components.slice(0)
  };
}

var characterDiff = new Diff();
function diffChars(oldStr, newStr, options) {
  return characterDiff.diff(oldStr, newStr, options);
}

//
// Ranges and exceptions:
// Latin-1 Supplement, 0080–00FF
//  - U+00D7  × Multiplication sign
//  - U+00F7  ÷ Division sign
// Latin Extended-A, 0100–017F
// Latin Extended-B, 0180–024F
// IPA Extensions, 0250–02AF
// Spacing Modifier Letters, 02B0–02FF
//  - U+02C7  ˇ &#711;  Caron
//  - U+02D8  ˘ &#728;  Breve
//  - U+02D9  ˙ &#729;  Dot Above
//  - U+02DA  ˚ &#730;  Ring Above
//  - U+02DB  ˛ &#731;  Ogonek
//  - U+02DC  ˜ &#732;  Small Tilde
//  - U+02DD  ˝ &#733;  Double Acute Accent
// Latin Extended Additional, 1E00–1EFF

var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;
var reWhitespace = /\S/;
var wordDiff = new Diff();

wordDiff.equals = function (left, right) {
  if (this.options.ignoreCase) {
    left = left.toLowerCase();
    right = right.toLowerCase();
  }

  return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
};

wordDiff.tokenize = function (value) {
  // All whitespace symbols except newline group into one token, each newline - in separate token
  var tokens = value.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/); // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.

  for (var i = 0; i < tokens.length - 1; i++) {
    // If we have an empty string in the next field and we have only word chars before and after, merge
    if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
      tokens[i] += tokens[i + 2];
      tokens.splice(i + 1, 2);
      i--;
    }
  }

  return tokens;
};

var lineDiff = new Diff();

lineDiff.tokenize = function (value) {
  var retLines = [],
      linesAndNewlines = value.split(/(\n|\r\n)/); // Ignore the final empty token that occurs if the string ends with a new line

  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  } // Merge the content and line separators into single tokens


  for (var i = 0; i < linesAndNewlines.length; i++) {
    var line = linesAndNewlines[i];

    if (i % 2 && !this.options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      if (this.options.ignoreWhitespace) {
        line = line.trim();
      }

      retLines.push(line);
    }
  }

  return retLines;
};

var sentenceDiff = new Diff();

sentenceDiff.tokenize = function (value) {
  return value.split(/(\S.+?[.!?])(?=\s+|$)/);
};

var cssDiff = new Diff();

cssDiff.tokenize = function (value) {
  return value.split(/([{}:;,]|\s+)/);
};

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

var objectPrototypeToString = Object.prototype.toString;
var jsonDiff = new Diff(); // Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
// dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:

jsonDiff.useLongestToken = true;
jsonDiff.tokenize = lineDiff.tokenize;

jsonDiff.castInput = function (value) {
  var _this$options = this.options,
      undefinedReplacement = _this$options.undefinedReplacement,
      _this$options$stringi = _this$options.stringifyReplacer,
      stringifyReplacer = _this$options$stringi === void 0 ? function (k, v) {
    return typeof v === 'undefined' ? undefinedReplacement : v;
  } : _this$options$stringi;
  return typeof value === 'string' ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), stringifyReplacer, '  ');
};

jsonDiff.equals = function (left, right) {
  return Diff.prototype.equals.call(jsonDiff, left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'));
};
// object that is already on the "stack" of items being processed. Accepts an optional replacer

function canonicalize(obj, stack, replacementStack, replacer, key) {
  stack = stack || [];
  replacementStack = replacementStack || [];

  if (replacer) {
    obj = replacer(key, obj);
  }

  var i;

  for (i = 0; i < stack.length; i += 1) {
    if (stack[i] === obj) {
      return replacementStack[i];
    }
  }

  var canonicalizedObj;

  if ('[object Array]' === objectPrototypeToString.call(obj)) {
    stack.push(obj);
    canonicalizedObj = new Array(obj.length);
    replacementStack.push(canonicalizedObj);

    for (i = 0; i < obj.length; i += 1) {
      canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, key);
    }

    stack.pop();
    replacementStack.pop();
    return canonicalizedObj;
  }

  if (obj && obj.toJSON) {
    obj = obj.toJSON();
  }

  if (_typeof(obj) === 'object' && obj !== null) {
    stack.push(obj);
    canonicalizedObj = {};
    replacementStack.push(canonicalizedObj);

    var sortedKeys = [],
        _key;

    for (_key in obj) {
      /* istanbul ignore else */
      if (obj.hasOwnProperty(_key)) {
        sortedKeys.push(_key);
      }
    }

    sortedKeys.sort();

    for (i = 0; i < sortedKeys.length; i += 1) {
      _key = sortedKeys[i];
      canonicalizedObj[_key] = canonicalize(obj[_key], stack, replacementStack, replacer, _key);
    }

    stack.pop();
    replacementStack.pop();
  } else {
    canonicalizedObj = obj;
  }

  return canonicalizedObj;
}

var arrayDiff = new Diff();

arrayDiff.tokenize = function (value) {
  return value.slice();
};

arrayDiff.join = arrayDiff.removeEmpty = function (value) {
  return value;
};

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
var version$1 = "0.0.3";
var description = "Record & Replay webpage";
var main = "index.js";
var scripts = {
	build: "rollup -c",
	dev: "npm run build -- -w",
	prepublish: "npm run build"
};
var repository = {
	type: "git",
	url: "git+https://github.com/song940/xreplay.git"
};
var keywords = [
];
var author = "Lsong";
var license = "MIT";
var bugs = {
	url: "https://github.com/song940/xreplay/issues"
};
var homepage = "https://github.com/song940/xreplay#readme";
var dependencies = {
	"is-mobile": "*",
	diff: "^5.0.0",
	tapable: "1.1.3",
	"brick.json": "^0.0.6",
	"smoothscroll-polyfill": "^0.4.4"
};
var devDependencies = {
	"@rollup/plugin-commonjs": "^20.0.0",
	"@rollup/plugin-json": "^4.1.0",
	"@rollup/plugin-node-resolve": "^13.0.4",
	"@rollup/plugin-replace": "^3.0.0",
	"@types/diff": "^5.0.1",
	"@types/node": "^16.7.10",
	"@types/node-sass": "^4.11.2",
	"@types/smoothscroll-polyfill": "^0.3.1",
	"@types/tapable": "1.0.6",
	"node-sass": "^6.0.1",
	"rollup-plugin-node-polyfills": "^0.2.1",
	"rollup-plugin-scss": "^3.0.0",
	"rollup-plugin-string": "^3.0.0",
	"rollup-plugin-terser": "^7.0.2",
	"rollup-plugin-typescript2": "^0.30.0",
	typescript: "^4.4.2"
};
var pkg = {
	name: name,
	version: version$1,
	description: description,
	main: main,
	scripts: scripts,
	repository: repository,
	keywords: keywords,
	author: author,
	license: license,
	bugs: bugs,
	homepage: homepage,
	dependencies: dependencies,
	devDependencies: devDependencies
};

function logError(e) {
    const msg = e.message || e;
    console.error(`TimeCat Error: ${msg}`);
    return msg;
}
function logWarn(e) {
    const msg = e.message || e;
    console.warn(`TimeCat Warning: ${msg}`);
    return msg;
}
function getTime() {
    return Date.now();
}
function getRandomCode(len = 8) {
    const code = (Math.random() * 20 + 16).toString(36).substring(2, len + 2);
    return code.toUpperCase();
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
function getStrDiffPatches(oldStr, newStr) {
    return getPatches(diffChars(oldStr, newStr));
}
function getPatches(changes) {
    let index = 0;
    const patches = changes
        .map(change => {
        const { added: add, removed: rm, value, count } = change;
        const len = count || 0;
        if (add) {
            const ret = {
                index,
                type: 'add',
                value
            };
            index += len;
            return ret;
        }
        else if (rm) {
            const ret = {
                index,
                type: 'rm',
                len
            };
            return ret;
        }
        index += len;
    })
        .filter(Boolean);
    return patches;
}
function throttle(func, wait, options = {}) {
    let context;
    let args;
    let result;
    let timeout = null;
    let previous = 0;
    const later = function () {
        previous = options.leading === false ? 0 : Date.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout)
            context = args = null;
    };
    return function () {
        const now = Date.now();
        if (!previous && options.leading === false)
            previous = now;
        const remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            result = func.apply(context, args);
            if (!timeout)
                context = args = null;
        }
        else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
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
const tempEmptyFn = () => { };
const tempEmptyPromise = () => Promise.resolve();

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
function isExistingNode(node) {
    return node.ownerDocument && !!node.ownerDocument.contains(node);
}

function float32ArrayToBase64(data) {
    return bufferArrayToBase64(data.buffer);
}
function bufferArrayToBase64(arrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
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

const getVNode = (el, opts = {}) => {
    return isElementNode(el)
        ? {
            id: opts.id || nodeStore.createNodeId(),
            type: el.nodeType,
            attrs: getAttr(el),
            tag: el.tagName.toLocaleLowerCase(),
            children: [],
            extra: getExtra(el, opts.isSVG)
        }
        : {
            id: opts.id || nodeStore.createNodeId(),
            type: el.nodeType,
            value: el.textContent
        };
};
const getAttr = (el) => {
    const resAttr = {};
    const { attributes } = el;
    if (attributes && attributes.length) {
        return Object.values(attributes).reduce((ret, attr) => {
            const [name, value] = extraAttr(attr);
            if (name) {
                ret[name] = value;
            }
            return ret;
        }, resAttr);
    }
    return resAttr;
};
function getExtra(node, isSVG) {
    var _a, _b;
    const { tagName } = node;
    const extra = {};
    const props = {};
    if (isSVG || tagName.toLowerCase() === 'svg') {
        extra.isSVG = true;
    }
    else if (tagName === 'INPUT') {
        const { checked, value } = node;
        if (value !== undefined) {
            props.value = value;
        }
        if (checked !== undefined) {
            props.checked = checked;
        }
    }
    else if (tagName === 'OPTION') {
        const { selected } = node;
        if (selected === true) {
            props.selected = true;
        }
    }
    else if (tagName === 'STYLE') {
        const rules = (_b = (_a = node) === null || _a === void 0 ? void 0 : _a.sheet) === null || _b === void 0 ? void 0 : _b.rules;
        if (rules && rules.length) {
            const cssTexts = Array.from(rules)
                .map(rule => rule.cssText)
                .join(' ');
            props.textContent = completeCssHref(cssTexts);
        }
    }
    else if (tagName === 'VIDEO') {
        props.autoplay = false;
        props.controls = false;
        props.loop = false;
        props.muted = true;
    }
    const scrollLeft = node.scrollLeft;
    const scrollTop = node.scrollTop;
    if (scrollTop || scrollLeft) {
        props.scroll = {
            left: scrollLeft,
            top: scrollTop
        };
    }
    if (Object.keys(props).length) {
        extra.props = props;
    }
    return extra;
}
const extraAttr = (attr) => {
    const { name, value } = attr;
    if (name === 'href' || name === 'src') {
        if (value.startsWith('#/')) {
            return [];
        }
        return [name, value];
    }
    return [name, value];
};
const createFlatVNode = (el, isSVG = false) => {
    const vNode = getVNode(el, { isSVG });
    const { id } = vNode;
    nodeStore.addNode(el, id);
    return vNode;
};
const createElement = (el, inheritSVG) => {
    var _a, _b, _c;
    const vNode = getVNode(el, { isSVG: inheritSVG });
    const { id } = vNode;
    nodeStore.addNode(el, id);
    if ((_c = (_b = (_a = vNode) === null || _a === void 0 ? void 0 : _a.extra) === null || _b === void 0 ? void 0 : _b.props) === null || _c === void 0 ? void 0 : _c.textContent) {
        return vNode;
    }
    if (vNode.type === Node.ELEMENT_NODE) {
        const vn = vNode;
        inheritSVG = inheritSVG || vn.extra.isSVG;
        el.childNodes.forEach((node) => {
            const child = createElement(node, inheritSVG);
            if (child) {
                vn.children.push(child);
            }
        });
    }
    return vNode;
};

class Watcher {
    constructor(options) {
        this.getNode = (id) => nodeStore.getNode.call(nodeStore, id);
        this.getNodeId = (n) => nodeStore.getNodeId.call(nodeStore, n);
        const { emit, context, relatedId, recorder } = options;
        this.options = options;
        this.recorder = recorder;
        this.relatedId = relatedId;
        this.context = context;
        this.recordOptions = context.G_RECORD_OPTIONS || window.G_RECORD_OPTIONS || {};
        this.emit = emit;
        this.init(options);
    }
    init(options) { }
    uninstall(fn) {
        this.options.listenStore.add(fn);
    }
    emitData(type, record, time = getTime(), callback) {
        const data = {
            type,
            data: record,
            relatedId: this.relatedId,
            time
        };
        if (callback) {
            return this.emit(callback(data));
        }
        this.emit(data);
    }
    registerEvent(options) {
        const { context, eventTypes, handleFn, listenerOptions, type, optimizeOptions, waitTime } = options;
        let listenerHandle;
        if (type === 'throttle') {
            listenerHandle = throttle(handleFn, waitTime, optimizeOptions);
        }
        else {
            listenerHandle = debounce(handleFn, waitTime, optimizeOptions);
        }
        eventTypes
            .map(type => (fn) => {
            context.addEventListener(type, fn, listenerOptions);
        })
            .forEach(handle => handle(listenerHandle));
        this.uninstall(() => {
            eventTypes.forEach(type => {
                context.removeEventListener(type, listenerHandle, listenerOptions);
            });
        });
    }
}

const defaultCrossUrl = 'https://timecatjs.com/all-origins?url=';
function rewriteNodes(vNodes, configs, preFetchCallback) {
    if (!configs) {
        return;
    }
    const { rewriteConfigs, preFetchConfigs } = configs.reduce((collect, config) => {
        if (config.type === 'preFetch') {
            collect.preFetchConfigs.push(config);
        }
        else {
            collect.rewriteConfigs.push(config);
        }
        return collect;
    }, { rewriteConfigs: [], preFetchConfigs: [] });
    if (rewriteConfigs.some(config => {
        const { matches, rewrite } = config;
        const { replaceOrigin } = rewrite;
        return !replaceOrigin || !matches;
    })) {
        return logError('The params replaceOrigin and matches is required for using rewriteResource');
    }
    function matchNodeSource(node, matches) {
        return (func) => {
            const { href, src } = node.attrs;
            Object.entries({ href, src })
                .filter(([, source]) => {
                if (!source) {
                    return;
                }
                return matches.some(item => {
                    if (typeof item === 'string') {
                        return source.endsWith('.' + item);
                    }
                    return item.test(source);
                });
            })
                .forEach(item => func(node, ...item));
        };
    }
    rewriteConfigs.forEach(config => {
        const { rewrite, matches } = config;
        const { replaceOrigin, folderPath, fn } = rewrite;
        const [base] = document.getElementsByTagName('base');
        const href = window.location.href;
        const rewriteNode = (node) => matchNodeSource(node, matches)(rewriteAttr);
        const rewriteAttr = (vNode, key, source) => {
            const target = vNode.attrs;
            const url = createURL(source, (base === null || base === void 0 ? void 0 : base.href) || href);
            const oldUrl = url.href;
            const nextUrl = pathJoin(replaceOrigin, folderPath || '', url.pathname);
            const targetUrl = (fn && fn(oldUrl, nextUrl)) || nextUrl;
            target[key] = targetUrl;
        };
        vNodes.forEach(rewriteNode);
    });
    preFetchConfigs.forEach(config => {
        const { rewrite, matches } = config;
        const strMatches = matches.filter(m => typeof m === 'string');
        if (!strMatches.every(s => s.endsWith('css'))) {
            return logError('PreFetch Resource only support [css] currently');
        }
        const { replaceOrigin, folderPath, crossUrl, fn, matches: subMatches } = rewrite;
        const [base] = document.getElementsByTagName('base');
        const href = window.location.href;
        const rewriteNode = (node) => matchNodeSource(node, matches)(preFetchSource);
        const preFetchSource = (vNode, key, source) => __awaiter(this, void 0, void 0, function* () {
            const url = createURL(source, (base === null || base === void 0 ? void 0 : base.href) || href);
            const resText = yield fetch(url.href)
                .then(res => res.text(), () => '')
                .catch(err => logWarn(err));
            if (!resText) {
                return;
            }
            const text = completeCssHref(resText, url.href, preUrl => {
                if (!subMatches) {
                    return preUrl;
                }
                let nextUrl;
                const url = createURL(preUrl, (base === null || base === void 0 ? void 0 : base.href) || href);
                const anyMatched = subMatches.some(item => {
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
            const data = {
                id: vNode.id,
                tag: vNode.tag,
                key,
                time: getTime(),
                url: url.href,
                text
            };
            preFetchCallback(data);
        });
        vNodes.forEach(rewriteNode);
    });
}
function pathJoin(...urls) {
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
    return urls.reduce((url, path) => {
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
    const encodeUrl = encodeURIComponent(preUrl);
    let nextUrl;
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

class DOMWatcher extends Watcher {
    init() {
        const Watcher = new MutationObserver(callback => this.mutationCallback(callback));
        Watcher.observe(this.context.document.documentElement, {
            attributeOldValue: true,
            attributes: true,
            characterData: true,
            characterDataOldValue: true,
            childList: true,
            subtree: true
        });
        this.uninstall(() => Watcher.disconnect());
    }
    mutationCallback(records) {
        const addNodesSet = new Set();
        const removeNodesMap = new Map();
        const moveNodesSet = new Set();
        const moveMarkSet = new Set();
        const attrNodesArray = [];
        const textNodesSet = new Set();
        const context = this;
        function deepAdd(n, target) {
            const id = context.getNodeId(n);
            if (id) {
                if (target) {
                    moveNodesSet.add(n);
                    removeNodesMap.delete(n);
                    const targetId = context.getNodeId(target);
                    if (targetId) {
                        moveMarkSet.add(targetId + '@' + id);
                    }
                }
            }
            else {
                addNodesSet.add(n);
            }
            n.childNodes.forEach(cn => deepAdd(cn));
        }
        function deepDeleteInSet(set, n) {
            set.delete(n);
            n.childNodes.forEach(cn => {
                deepDeleteInSet(set, cn);
            });
        }
        function rmNode(n, target) {
            if (!n) {
                return;
            }
            const id = context.getNodeId(n);
            const pId = context.getNodeId(n.parentNode);
            if (addNodesSet.has(n)) {
                deepDeleteInSet(addNodesSet, n);
                removeNodesMap.set(n, target);
            }
            else if (moveNodesSet.has(n) && moveMarkSet.has(pId + '@' + id)) {
                deepDeleteInSet(moveNodesSet, n);
                moveMarkSet.delete(pId + '@' + id);
            }
            else {
                removeNodesMap.set(n, target);
            }
        }
        records.forEach(record => {
            const { target, addedNodes, removedNodes, type, attributeName, oldValue } = record;
            switch (type) {
                case 'attributes':
                    attrNodesArray.push({ key: attributeName, node: target, oldValue });
                    break;
                case 'characterData':
                    textNodesSet.add(target);
                    break;
                case 'childList':
                    addedNodes.forEach(n => deepAdd(n, target));
                    removedNodes.forEach(n => rmNode(n, target));
                    break;
            }
        });
        const addedNodes = [];
        const addedVNodesMap = new Map();
        addNodesSet.forEach((node) => {
            const parentId = this.getNodeId(node.parentNode);
            const id = nodeStore.getNodeId(node);
            const vn = id ? getVNode(node, { id }) : createFlatVNode(node);
            if (isVNode(vn)) {
                const name = node.constructor.name;
                if (name.startsWith('SVG')) {
                    vn.extra.isSVG = true;
                }
            }
            addedNodes.push({
                parentId,
                nextId: this.getNodeId(node.nextSibling) || null,
                node: vn
            });
            if (isVNode(vn)) {
                addedVNodesMap.set(vn.id, vn);
            }
        });
        const movedNodes = [];
        moveNodesSet.forEach(node => {
            const nodeId = this.getNodeId(node);
            movedNodes.push({
                parentId: this.getNodeId(node.parentNode),
                nextId: this.getNodeId(node.nextSibling) || null,
                id: nodeId
            });
        });
        const removedNodes = [];
        removeNodesMap.forEach((parent, node) => {
            const id = this.getNodeId(node);
            const parentId = this.getNodeId(parent);
            if (id && parentId) {
                removedNodes.push({
                    parentId,
                    id
                });
            }
        });
        const attrs = attrNodesArray
            .map(data => {
            const { node, key, oldValue } = data;
            if (isExistingNode(node)) {
                const value = node.getAttribute(key);
                if (oldValue === value) {
                    return null;
                }
                const id = this.getNodeId(node);
                if (node.tagName === 'IFRAME' && key === 'src') {
                    this.waitAndRecordIFrame(node);
                }
                return {
                    id,
                    key,
                    value
                };
            }
        })
            .filter(Boolean);
        const texts = [...textNodesSet]
            .map(textNode => {
            if (isExistingNode(textNode) && textNode.parentNode) {
                return {
                    id: this.getNodeId(textNode),
                    parentId: this.getNodeId(textNode.parentNode),
                    value: textNode.textContent
                };
            }
        })
            .filter(Boolean);
        const data = {
            addedNodes,
            movedNodes,
            removedNodes,
            attrs,
            texts
        };
        Object.keys(data).forEach((type) => {
            if (!data[type].length) {
                delete data[type];
            }
        });
        const time = getTime();
        if (data.addedNodes) {
            this.watchIFrames(addedNodes);
            this.rewriteAddedSource(addedNodes, time);
        }
        if (Object.values(data).some(item => item.length)) {
            this.emitData(RecordType.DOM, data, time);
        }
    }
    waitAndRecordIFrame(iframe) {
        var _a, _b;
        const contentWindow = iframe.contentWindow;
        (_b = (_a = iframe) === null || _a === void 0 ? void 0 : _a.frameRecorder) === null || _b === void 0 ? void 0 : _b.destroy();
        const onLoadHandle = () => {
            this.recorder.recordIFrame(contentWindow);
            iframe.removeEventListener('load', onLoadHandle);
        };
        iframe.addEventListener('load', onLoadHandle);
    }
    findElementsByTag(name, updateNodeData) {
        const elements = updateNodeData.filter(data => {
            return data.node.tag === name;
        });
        return elements;
    }
    watchIFrames(addedNodes) {
        const iframeNodes = this.findElementsByTag('iframe', addedNodes);
        if (iframeNodes.length) {
            iframeNodes
                .map(node => nodeStore.getNode(node.node.id))
                .filter(Boolean)
                .map(iframeElement => iframeElement.contentWindow)
                .forEach((context) => this.recorder.recordIFrame(context));
        }
    }
    rewriteAddedSource(addedNodes, time) {
        const { G_RECORD_OPTIONS: options } = window;
        const configs = (options === null || options === void 0 ? void 0 : options.rewriteResource) || [];
        if (!(configs === null || configs === void 0 ? void 0 : configs.length)) {
            return;
        }
        const vNodes = addedNodes.map(item => item.node).filter(node => isVNode(node) && node);
        rewriteNodes(vNodes, configs, data => this.emitData(RecordType.PATCH, data, time + 1));
    }
}

class FormElementWatcher extends Watcher {
    init() {
        this.listenInputs(this.options);
        this.hijackInputs(this.options);
    }
    listenInputs(options) {
        const { context } = options;
        let eventTypes;
        (function (eventTypes) {
            eventTypes["input"] = "input";
            eventTypes["change"] = "change";
            eventTypes["focus"] = "focus";
            eventTypes["blur"] = "blur";
        })(eventTypes || (eventTypes = {}));
        const eventListenerOptions = { once: false, passive: true, capture: true };
        Object.values(eventTypes)
            .map(type => (fn) => {
            context.addEventListener(type, fn, eventListenerOptions);
            this.uninstall(() => context.removeEventListener(type, fn, eventListenerOptions));
        })
            .forEach(call => call(handleFn.bind(this)));
        function handleFn(e) {
            const eventType = e.type;
            let data;
            switch (eventType) {
                case eventTypes.input:
                case eventTypes.change:
                    const target = e.target;
                    const inputType = target.getAttribute('type') || 'text';
                    let key = 'value';
                    const value = target.value || '';
                    let newValue = '';
                    const patches = [];
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
                            patches.push(...getStrDiffPatches(target.oldValue, value));
                        }
                        target.oldValue = value;
                    }
                    data = {
                        type: eventType === 'input' ? FormElementEvent.INPUT : FormElementEvent.CHANGE,
                        id: this.getNodeId(e.target),
                        key,
                        value: !patches.length ? newValue : null,
                        patches
                    };
                    break;
                case eventTypes.focus:
                    data = {
                        type: FormElementEvent.FOCUS,
                        id: this.getNodeId(e.target)
                    };
                    break;
                case eventTypes.blur:
                    data = {
                        type: FormElementEvent.BLUR,
                        id: this.getNodeId(e.target)
                    };
                    break;
            }
            this.emitData(RecordType.FORM_EL, data);
        }
    }
    hijackInputs(options) {
        const { context } = options;
        const self = this;
        function handleEvent(key, value) {
            const data = {
                type: FormElementEvent.PROP,
                id: self.getNodeId(this),
                key,
                value
            };
            self.emitData(RecordType.FORM_EL, data);
        }
        const hijacking = (key, target) => {
            const original = context.Object.getOwnPropertyDescriptor(target, key);
            context.Object.defineProperty(target, key, {
                set: function (value) {
                    setTimeout(() => {
                        handleEvent.call(this, key, value);
                    });
                    if (original && original.set) {
                        original.set.call(this, value);
                    }
                }
            });
            this.uninstall(() => {
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
        ]).forEach((target, key) => hijacking(key, target));
    }
}

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
class LocationWatcher extends Watcher {
    constructor() {
        super(...arguments);
        this.locationHandle = (e) => {
            var _a, _b;
            const contextNodeId = this.getContextNodeId(e);
            const [, , path] = e.arguments || [, , (_b = (_a = this.context) === null || _a === void 0 ? void 0 : _a.location) === null || _b === void 0 ? void 0 : _b.pathname];
            const { href, hash } = this.context.location;
            const title = document.title;
            this.emitData(RecordType.LOCATION, {
                contextNodeId,
                href,
                hash,
                path,
                title
            });
        };
        this.emitOne = () => this.locationHandle({ target: window });
    }
    init() {
        this.context.history.pushState = this.kidnapLocation(LocationTypes.pushState);
        this.context.history.replaceState = this.kidnapLocation(LocationTypes.replaceState);
        const types = Object.values(LocationTypes);
        types.forEach(type => this.toggleListener(MethodType.add, type, this.locationHandle));
        this.uninstall(() => {
            types.forEach(type => this.toggleListener(MethodType.rm, type, this.locationHandle));
        });
    }
    toggleListener(methodType, type, handle) {
        this.context[methodType === MethodType.add ? 'addEventListener' : 'removeEventListener'](type, handle);
    }
    kidnapLocation(type) {
        const ctx = this.context;
        const original = ctx.history[type];
        return function () {
            const result = original.apply(this, arguments);
            const e = new Event(type);
            e.arguments = arguments;
            ctx.dispatchEvent(e);
            return result;
        };
    }
    getContextNodeId(e) {
        return this.getNodeId(e.target.document.documentElement);
    }
}

var Limit;
(function (Limit) {
    Limit[Limit["All"] = 0] = "All";
    Limit[Limit["Two"] = 1] = "Two";
    Limit[Limit["One"] = 2] = "One";
})(Limit || (Limit = {}));
let config$1;
let rootDocument;
function finder(input, options) {
    if (input.nodeType !== Node.ELEMENT_NODE) {
        throw new Error(`Can't generate CSS selector for non-element node type.`);
    }
    if ("html" === input.tagName.toLowerCase()) {
        return "html";
    }
    const defaults = {
        root: document.body,
        idName: (name) => true,
        className: (name) => true,
        tagName: (name) => true,
        attr: (name, value) => false,
        seedMinLength: 1,
        optimizedMinLength: 2,
        threshold: 1000,
        maxNumberOfTries: 10000,
    };
    config$1 = Object.assign(Object.assign({}, defaults), options);
    rootDocument = findRootDocument(config$1.root, defaults);
    let path = bottomUpSearch(input, Limit.All, () => bottomUpSearch(input, Limit.Two, () => bottomUpSearch(input, Limit.One)));
    if (path) {
        const optimized = sort(optimize(path, input));
        if (optimized.length > 0) {
            path = optimized[0];
        }
        return selector(path);
    }
    else {
        throw new Error(`Selector was not found.`);
    }
}
function findRootDocument(rootNode, defaults) {
    if (rootNode.nodeType === Node.DOCUMENT_NODE) {
        return rootNode;
    }
    if (rootNode === defaults.root) {
        return rootNode.ownerDocument;
    }
    return rootNode;
}
function bottomUpSearch(input, limit, fallback) {
    let path = null;
    let stack = [];
    let current = input;
    let i = 0;
    while (current && current !== config$1.root.parentElement) {
        let level = maybe(id(current)) ||
            maybe(...attr(current)) ||
            maybe(...classNames(current)) ||
            maybe(tagName(current)) || [any()];
        const nth = index(current);
        if (limit === Limit.All) {
            if (nth) {
                level = level.concat(level.filter(dispensableNth).map((node) => nthChild(node, nth)));
            }
        }
        else if (limit === Limit.Two) {
            level = level.slice(0, 1);
            if (nth) {
                level = level.concat(level.filter(dispensableNth).map((node) => nthChild(node, nth)));
            }
        }
        else if (limit === Limit.One) {
            const [node] = (level = level.slice(0, 1));
            if (nth && dispensableNth(node)) {
                level = [nthChild(node, nth)];
            }
        }
        for (let node of level) {
            node.level = i;
        }
        stack.push(level);
        if (stack.length >= config$1.seedMinLength) {
            path = findUniquePath(stack, fallback);
            if (path) {
                break;
            }
        }
        current = current.parentElement;
        i++;
    }
    if (!path) {
        path = findUniquePath(stack, fallback);
    }
    return path;
}
function findUniquePath(stack, fallback) {
    const paths = sort(combinations(stack));
    if (paths.length > config$1.threshold) {
        return fallback ? fallback() : null;
    }
    for (let candidate of paths) {
        if (unique(candidate)) {
            return candidate;
        }
    }
    return null;
}
function selector(path) {
    let node = path[0];
    let query = node.name;
    for (let i = 1; i < path.length; i++) {
        const level = path[i].level || 0;
        if (node.level === level - 1) {
            query = `${path[i].name} > ${query}`;
        }
        else {
            query = `${path[i].name} ${query}`;
        }
        node = path[i];
    }
    return query;
}
function penalty(path) {
    return path.map((node) => node.penalty).reduce((acc, i) => acc + i, 0);
}
function unique(path) {
    switch (rootDocument.querySelectorAll(selector(path)).length) {
        case 0:
            throw new Error(`Can't select any node with this selector: ${selector(path)}`);
        case 1:
            return true;
        default:
            return false;
    }
}
function id(input) {
    const elementId = input.getAttribute("id");
    if (elementId && config$1.idName(elementId)) {
        return {
            name: "#" + cssesc(elementId, { isIdentifier: true }),
            penalty: 0,
        };
    }
    return null;
}
function attr(input) {
    const attrs = Array.from(input.attributes).filter((attr) => config$1.attr(attr.name, attr.value));
    return attrs.map((attr) => ({
        name: "[" +
            cssesc(attr.name, { isIdentifier: true }) +
            '="' +
            cssesc(attr.value) +
            '"]',
        penalty: 0.5,
    }));
}
function classNames(input) {
    const names = Array.from(input.classList).filter(config$1.className);
    return names.map((name) => ({
        name: "." + cssesc(name, { isIdentifier: true }),
        penalty: 1,
    }));
}
function tagName(input) {
    const name = input.tagName.toLowerCase();
    if (config$1.tagName(name)) {
        return {
            name,
            penalty: 2,
        };
    }
    return null;
}
function any() {
    return {
        name: "*",
        penalty: 3,
    };
}
function index(input) {
    const parent = input.parentNode;
    if (!parent) {
        return null;
    }
    let child = parent.firstChild;
    if (!child) {
        return null;
    }
    let i = 0;
    while (child) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            i++;
        }
        if (child === input) {
            break;
        }
        child = child.nextSibling;
    }
    return i;
}
function nthChild(node, i) {
    return {
        name: node.name + `:nth-child(${i})`,
        penalty: node.penalty + 1,
    };
}
function dispensableNth(node) {
    return node.name !== "html" && !node.name.startsWith("#");
}
function maybe(...level) {
    const list = level.filter(notEmpty);
    if (list.length > 0) {
        return list;
    }
    return null;
}
function notEmpty(value) {
    return value !== null && value !== undefined;
}
function* combinations(stack, path = []) {
    if (stack.length > 0) {
        for (let node of stack[0]) {
            yield* combinations(stack.slice(1, stack.length), path.concat(node));
        }
    }
    else {
        yield path;
    }
}
function sort(paths) {
    return Array.from(paths).sort((a, b) => penalty(a) - penalty(b));
}
function* optimize(path, input, scope = {
    counter: 0,
    visited: new Map(),
}) {
    if (path.length > 2 && path.length > config$1.optimizedMinLength) {
        for (let i = 1; i < path.length - 1; i++) {
            if (scope.counter > config$1.maxNumberOfTries) {
                return;
            }
            scope.counter += 1;
            const newPath = [...path];
            newPath.splice(i, 1);
            const newPathKey = selector(newPath);
            if (scope.visited.has(newPathKey)) {
                return;
            }
            if (unique(newPath) && same(newPath, input)) {
                yield newPath;
                scope.visited.set(newPathKey, true);
                yield* optimize(newPath, input, scope);
            }
        }
    }
}
function same(path, input) {
    return rootDocument.querySelector(selector(path)) === input;
}
const regexAnySingleEscape = /[ -,\.\/:-@\[-\^`\{-~]/;
const regexSingleEscape = /[ -,\.\/:-@\[\]\^`\{-~]/;
const regexExcessiveSpaces = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g;
const defaultOptions = {
    escapeEverything: false,
    isIdentifier: false,
    quotes: "single",
    wrap: false,
};
function cssesc(string, opt = {}) {
    const options = Object.assign(Object.assign({}, defaultOptions), opt);
    if (options.quotes != "single" && options.quotes != "double") {
        options.quotes = "single";
    }
    const quote = options.quotes == "double" ? '"' : "'";
    const isIdentifier = options.isIdentifier;
    const firstChar = string.charAt(0);
    let output = "";
    let counter = 0;
    const length = string.length;
    while (counter < length) {
        const character = string.charAt(counter++);
        let codePoint = character.charCodeAt(0);
        let value = void 0;
        if (codePoint < 0x20 || codePoint > 0x7e) {
            if (codePoint >= 0xd800 && codePoint <= 0xdbff && counter < length) {
                const extra = string.charCodeAt(counter++);
                if ((extra & 0xfc00) == 0xdc00) {
                    codePoint = ((codePoint & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
                }
                else {
                    counter--;
                }
            }
            value = "\\" + codePoint.toString(16).toUpperCase() + " ";
        }
        else {
            if (options.escapeEverything) {
                if (regexAnySingleEscape.test(character)) {
                    value = "\\" + character;
                }
                else {
                    value = "\\" + codePoint.toString(16).toUpperCase() + " ";
                }
            }
            else if (/[\t\n\f\r\x0B]/.test(character)) {
                value = "\\" + codePoint.toString(16).toUpperCase() + " ";
            }
            else if (character == "\\" ||
                (!isIdentifier &&
                    ((character == '"' && quote == character) ||
                        (character == "'" && quote == character))) ||
                (isIdentifier && regexSingleEscape.test(character))) {
                value = "\\" + character;
            }
            else {
                value = character;
            }
        }
        output += value;
    }
    if (isIdentifier) {
        if (/^-[-\d]/.test(output)) {
            output = "\\-" + output.slice(1);
        }
        else if (/\d/.test(firstChar)) {
            output = "\\3" + firstChar + " " + output.slice(1);
        }
    }
    output = output.replace(regexExcessiveSpaces, function ($0, $1, $2) {
        if ($1 && $1.length % 2) {
            return $0;
        }
        return ($1 || "") + $2;
    });
    if (!isIdentifier && options.wrap) {
        return quote + output + quote;
    }
    return output;
}

class MouseWatcher extends Watcher {
    init() {
        this.mouseMove();
        this.mouseClick();
        this.detectScrolling();
    }
    detectScrolling() {
        let timer;
        const evt = () => {
            this.scrolling = true;
            clearTimeout(timer);
            timer = this.context.setTimeout(() => {
                this.scrolling = false;
                if (this.latestMove) {
                    this.sendMoveData(this.latestMove);
                    this.latestMove = null;
                }
            }, 500);
        };
        const eventNames = ['mousewheel', 'scroll'];
        eventNames.forEach(name => {
            this.context.addEventListener(name, evt, true);
            this.uninstall(() => {
                this.context.removeEventListener(name, evt, true);
            });
        });
    }
    sendMoveData(position) {
        const { x, y, id } = position;
        this.emitData(RecordType.MOUSE, {
            type: MouseEventType.MOVE,
            id,
            x,
            y
        });
    }
    mouseMove() {
        const evt = (e) => {
            const offsetPosition = this.getOffsetPosition(e, this.context);
            if (this.scrolling) {
                this.latestMove = offsetPosition;
                return;
            }
            offsetPosition && this.sendMoveData(offsetPosition);
        };
        const name = 'mousemove';
        const listenerHandle = throttle(evt, 300, {
            trailing: true,
            leading: true
        });
        this.context.addEventListener(name, listenerHandle);
        this.uninstall(() => {
            this.context.removeEventListener(name, listenerHandle);
        });
    }
    mouseClick() {
        const evt = (e) => {
            const selector = finder(e.target);
            const offsetPosition = this.getOffsetPosition(e, this.context);
            if (offsetPosition) {
                this.emitData(RecordType.MOUSE, Object.assign({ type: MouseEventType.CLICK, selector }, offsetPosition));
            }
        };
        const name = 'click';
        const listenerHandle = throttle(evt, 250);
        this.uninstall(() => {
            this.context.removeEventListener(name, listenerHandle);
        });
        this.context.addEventListener(name, listenerHandle);
    }
    getOffsetPosition(event, context) {
        var _a;
        const { mode } = context.G_RECORD_OPTIONS;
        const { view, target, x, y, offsetX, offsetY } = event;
        if (view === context) {
            const doc = target.ownerDocument;
            function isInline(target) {
                return context.getComputedStyle(target).display === 'inline';
            }
            function getRotate(node) {
                if (!isExistingNode(node)) {
                    return 0;
                }
                const computedStyle = context.getComputedStyle(node);
                const matrix = computedStyle['transform'];
                let angle;
                if (matrix !== 'none') {
                    const values = matrix.split('(')[1].split(')')[0].split(',');
                    const a = Number(values[0]);
                    const b = Number(values[1]);
                    angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
                }
                else {
                    angle = 0;
                }
                return angle < 0 ? angle + 360 : angle;
            }
            let node = target;
            let id = undefined;
            if (isExistingNode(node)) {
                while (isInline(node)) {
                    node = node.parentElement;
                }
                id = this.getNodeId(node);
            }
            const deg = getRotate(node);
            let position;
            if (deg || !id) {
                return null;
            }
            else {
                position = {
                    id,
                    x: offsetX,
                    y: offsetY
                };
            }
            const frameElement = (_a = doc === null || doc === void 0 ? void 0 : doc.defaultView) === null || _a === void 0 ? void 0 : _a.frameElement;
            if (frameElement && mode === 'default') {
                const rect = frameElement.getBoundingClientRect();
                position.y += rect.top;
                position.x += rect.left;
            }
            return position;
        }
        return false;
    }
}

class ScrollWatcher extends Watcher {
    getCompatibleTarget(target) {
        return target.scrollingElement || target.documentElement;
    }
    scrollTop(target) {
        return target.scrollTop;
    }
    scrollLeft(target) {
        return target.scrollLeft;
    }
    init() {
        const { scrollingElement } = this.context.document;
        this.emitData(...this.wrapData(scrollingElement || document, true));
        this.registerEvent({
            context: this.context,
            eventTypes: ['scroll'],
            handleFn: this.handleFn.bind(this),
            listenerOptions: { capture: true },
            type: 'throttle',
            optimizeOptions: { leading: true, trailing: true },
            waitTime: 300
        });
    }
    wrapData(target, isAuto = false) {
        const element = target instanceof this.context.HTMLElement ? target : this.getCompatibleTarget(target);
        const data = {
            id: this.getNodeId(element) || null,
            top: this.scrollTop(element),
            left: this.scrollLeft(element)
        };
        if (isAuto) {
            data.behavior = 'auto';
        }
        return [RecordType.SCROLL, data];
    }
    handleFn(e) {
        const { type, target } = e;
        if (type === 'scroll') {
            this.emitData(...this.wrapData(target));
        }
    }
}

class WindowWatcher extends Watcher {
    width() {
        return this.context.innerWidth;
    }
    height() {
        return this.context.innerHeight;
    }
    init() {
        this.emitData(...this.wrapData(null));
        this.registerEvent({
            context: this.context,
            eventTypes: ['resize'],
            handleFn: this.handleFn.bind(this),
            listenerOptions: { capture: true },
            type: 'throttle',
            optimizeOptions: { trailing: true },
            waitTime: 500
        });
    }
    handleFn(e) {
        const { type, target } = e;
        let id = null;
        if (target && target instanceof HTMLElement) {
            if (target.constructor.name === HTMLVideoElement.name) {
                return;
            }
            id = this.getNodeId(target);
        }
        if (type === 'resize') {
            this.emitData(...this.wrapData(id));
        }
    }
    wrapData(id) {
        return [
            RecordType.WINDOW,
            {
                id,
                width: this.width(),
                height: this.height()
            }
        ];
    }
}

class TerminateWatcher extends Watcher {
    init() {
        this.context.addEventListener('beforeunload', this.handleFn);
        this.uninstall(() => {
            this.context.removeEventListener('beforeunload', this.handleFn);
        });
    }
    handleFn() {
    }
    wrapData() {
        return [RecordType.TERMINATE, null];
    }
}

class FontWatcher extends Watcher {
    init() {
        if (this.recordOptions.font) {
            this.interceptAddFont();
        }
    }
    interceptAddFont() {
        const original = window.FontFace;
        const self = this;
        function FontFace(family, source) {
            function ab2str(buffer) {
                const buf = new Uint16Array(buffer);
                const len = buf.byteLength;
                let gap = Math.pow(2, 16) - 1;
                let res = '';
                for (let i = 0; i < len; i += gap) {
                    if (i + gap > len) {
                        gap = len - i;
                    }
                    res += String.fromCharCode.apply(null, buf.subarray(i, i + gap));
                }
                return res;
            }
            const font = new original(family, source);
            self.emitData(RecordType.FONT, {
                family,
                source: typeof source === 'string' ? source : ab2str(source)
            });
            document.fonts.add(font);
        }
        window.FontFace = FontFace;
        this.uninstall(() => {
            window.FontFace = original;
        });
    }
}

const baseWatchers = {
    DOMWatcher,
    FormElementWatcher,
    MouseWatcher,
    ScrollWatcher
};
const watchers = Object.assign(Object.assign({ LocationWatcher }, baseWatchers), { WindowWatcher,
    FontWatcher,
    TerminateWatcher });

class AudioRecorder {
    constructor(opts = AudioRecorder.defaultRecordOptions) {
        this.setOptions(opts);
    }
    getOptions() {
        return this.opts;
    }
    setOptions(opts = AudioRecorder.defaultRecordOptions) {
        this.opts = Object.assign(Object.assign({}, this.opts), opts);
    }
    beginRecord() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: this.opts.sampleRate });
        this.mediaNode = this.audioContext.createMediaStreamSource(this.mediaStream);
        const createScript = this.audioContext.createScriptProcessor;
        this.processNode = createScript.call(this.audioContext, 4096, this.opts.channelCount, this.opts.channelCount);
        this.processNode.connect(this.audioContext.destination);
        this.processNode.onaudioprocess = onAudioProcess.bind(this);
        function onAudioProcess(event) {
            const inputBuffer = event.inputBuffer;
            const audioBuffer_0 = inputBuffer.getChannelData(0).slice();
            if (this.onProgress) {
                const data = [float32ArrayToBase64(audioBuffer_0)];
                this.onProgress(data);
            }
        }
        this.mediaNode.connect(this.processNode);
    }
    initRecorder() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                window.navigator.mediaDevices
                    .getUserMedia({
                    audio: {
                        sampleRate: this.opts.sampleRate,
                        channelCount: this.opts.channelCount,
                        echoCancellation: true,
                        latency: 0
                    }
                })
                    .then(mediaStream => resolve(mediaStream))
                    .catch(err => reject(err));
            });
        });
    }
    start(opts = AudioRecorder.defaultRecordOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setOptions(opts);
            this.mediaStream = yield this.initRecorder();
            this.mediaStream && this.beginRecord();
        });
    }
    stop() {
        this.mediaStream && this.mediaStream.getAudioTracks()[0].stop();
        this.processNode && this.processNode.disconnect();
        this.mediaNode && this.mediaNode.disconnect();
    }
    pause() { }
    resume() { }
}
AudioRecorder.defaultRecordOptions = {
    sampleBits: 8,
    sampleRate: 48000,
    channelCount: 1
};

class AudioWatcher extends Watcher {
    constructor(options) {
        super(options);
    }
    init() {
        const recorder = new AudioRecorder({
            sampleBits: 8,
            sampleRate: 8000,
            channelCount: 1
        });
        recorder.start();
        this.uninstall(() => {
            recorder.stop();
        });
        this.emitData(RecordType.AUDIO, {
            type: 'opts',
            data: recorder.getOptions()
        });
        recorder.onProgress = audioBase64Data => {
            const data = {
                encode: 'base64',
                type: 'pcm',
                data: audioBase64Data
            };
            this.emitData(RecordType.AUDIO, data);
        };
    }
}

class Snapshot extends Watcher {
    init() {
        const snapshotData = this.DOMSnapshotData(this.options.context || window);
        const time = getTime();
        this.checkNodesData(snapshotData, time);
        this.emitData(RecordType.SNAPSHOT, snapshotData, time);
    }
    DOMSnapshotData(context) {
        return Object.assign({ vNode: createElement(context.document.documentElement) }, this.getInitInfo(context));
    }
    getInitInfo(context) {
        const { name, publicId, systemId } = context.document.doctype || {};
        const doctype = () => ({ name, publicId, systemId });
        const href = () => context.location.href;
        const width = () => context.innerWidth;
        const height = () => context.innerHeight;
        const scrollTop = () => context.pageYOffset;
        const scrollLeft = () => context.pageXOffset;
        const [base] = document.getElementsByTagName('base');
        const getFrameElement = () => context.frameElement;
        const frameElement = getFrameElement();
        const frameId = nodeStore.getNodeId(frameElement) || null;
        const baseHref = base === null || base === void 0 ? void 0 : base.href;
        return {
            doctype: doctype(),
            href: baseHref || href(),
            scrollTop: scrollTop(),
            scrollLeft: scrollLeft(),
            width: width(),
            height: height(),
            frameId
        };
    }
    checkNodesData({ vNode }, time) {
        const { G_RECORD_OPTIONS: options } = window;
        const configs = (options === null || options === void 0 ? void 0 : options.rewriteResource) || [];
        if (!(configs === null || configs === void 0 ? void 0 : configs.length)) {
            return;
        }
        const deepLoopChildNodes = (children) => {
            const vNodes = [];
            children.forEach(child => {
                const c = child;
                if (isVNode(c)) {
                    vNodes.push(c, ...deepLoopChildNodes(c.children));
                }
            });
            return vNodes;
        };
        rewriteNodes(deepLoopChildNodes(vNode.children), configs, data => {
            this.emitData(RecordType.PATCH, data, time + 1);
        });
    }
}

function getHeadData() {
    return {
        href: location.href,
        title: document.title,
        relatedId: getRandomCode(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        beginTime: getTime(),
        version: pkg.version
    };
}

function getAugmentedNamespace(n) {
	if (n.__esModule) return n;
	var a = Object.defineProperty({}, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var lib = {};

var global$1 = (typeof global !== "undefined" ? global :
  typeof self !== "undefined" ? self :
  typeof window !== "undefined" ? window : {});

var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
var inited = false;
function init () {
  inited = true;
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
  }

  revLookup['-'.charCodeAt(0)] = 62;
  revLookup['_'.charCodeAt(0)] = 63;
}

function toByteArray (b64) {
  if (!inited) {
    init();
  }
  var i, j, l, tmp, placeHolders, arr;
  var len = b64.length;

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders);

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len;

  var L = 0;

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
    arr[L++] = (tmp >> 16) & 0xFF;
    arr[L++] = (tmp >> 8) & 0xFF;
    arr[L++] = tmp & 0xFF;
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
    arr[L++] = tmp & 0xFF;
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
    arr[L++] = (tmp >> 8) & 0xFF;
    arr[L++] = tmp & 0xFF;
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp;
  var output = [];
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
    output.push(tripletToBase64(tmp));
  }
  return output.join('')
}

function fromByteArray (uint8) {
  if (!inited) {
    init();
  }
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
  var output = '';
  var parts = [];
  var maxChunkLength = 16383; // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    output += lookup[tmp >> 2];
    output += lookup[(tmp << 4) & 0x3F];
    output += '==';
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
    output += lookup[tmp >> 10];
    output += lookup[(tmp >> 4) & 0x3F];
    output += lookup[(tmp << 2) & 0x3F];
    output += '=';
  }

  parts.push(output);

  return parts.join('')
}

function read (buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? (nBytes - 1) : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

function write (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
  var i = isLE ? 0 : (nBytes - 1);
  var d = isLE ? 1 : -1;
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128;
}

var toString = {}.toString;

var isArray$1 = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var INSPECT_MAX_BYTES = 50;

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
  ? global$1.TYPED_ARRAY_SUPPORT
  : true;

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length);
    that.__proto__ = Buffer.prototype;
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length);
    }
    that.length = length;
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192; // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype;
  return arr
};

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
};

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype;
  Buffer.__proto__ = Uint8Array;
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size);
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
};

function allocUnsafe (that, size) {
  assertSize(size);
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0;
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
};
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
};

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8';
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0;
  that = createBuffer(that, length);

  var actual = that.write(string, encoding);

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual);
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0;
  that = createBuffer(that, length);
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255;
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength; // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array);
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset);
  } else {
    array = new Uint8Array(array, byteOffset, length);
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array;
    that.__proto__ = Buffer.prototype;
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array);
  }
  return that
}

function fromObject (that, obj) {
  if (internalIsBuffer(obj)) {
    var len = checked(obj.length) | 0;
    that = createBuffer(that, len);

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len);
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray$1(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}
Buffer.isBuffer = isBuffer$1;
function internalIsBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
};

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
};

Buffer.concat = function concat (list, length) {
  if (!isArray$1(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i;
  if (length === undefined) {
    length = 0;
    for (i = 0; i < list.length; ++i) {
      length += list[i].length;
    }
  }

  var buffer = Buffer.allocUnsafe(length);
  var pos = 0;
  for (i = 0; i < list.length; ++i) {
    var buf = list[i];
    if (!internalIsBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer
};

function byteLength (string, encoding) {
  if (internalIsBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string;
  }

  var len = string.length;
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
}
Buffer.byteLength = byteLength;

function slowToString (encoding, start, end) {
  var loweredCase = false;

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0;
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length;
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0;
  start >>>= 0;

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8';

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase();
        loweredCase = true;
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true;

function swap (b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length;
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1);
  }
  return this
};

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length;
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3);
    swap(this, i + 1, i + 2);
  }
  return this
};

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length;
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7);
    swap(this, i + 1, i + 6);
    swap(this, i + 2, i + 5);
    swap(this, i + 3, i + 4);
  }
  return this
};

Buffer.prototype.toString = function toString () {
  var length = this.length | 0;
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
};

Buffer.prototype.equals = function equals (b) {
  if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
};

Buffer.prototype.inspect = function inspect () {
  var str = '';
  var max = INSPECT_MAX_BYTES;
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
    if (this.length > max) str += ' ... ';
  }
  return '<Buffer ' + str + '>'
};

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!internalIsBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0;
  }
  if (end === undefined) {
    end = target ? target.length : 0;
  }
  if (thisStart === undefined) {
    thisStart = 0;
  }
  if (thisEnd === undefined) {
    thisEnd = this.length;
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;

  if (this === target) return 0

  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);

  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
};

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff;
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000;
  }
  byteOffset = +byteOffset;  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1);
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding);
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (internalIsBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF; // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase();
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i;
  if (dir) {
    var foundIndex = -1;
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i;
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex;
        foundIndex = -1;
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
    for (i = byteOffset; i >= 0; i--) {
      var found = true;
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false;
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
};

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
};

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
};

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = Number(length);
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed;
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8';
    length = this.length;
    offset = 0;
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset;
    length = this.length;
    offset = 0;
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0;
    if (isFinite(length)) {
      length = length | 0;
      if (encoding === undefined) encoding = 'utf8';
    } else {
      encoding = length;
      length = undefined;
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset;
  if (length === undefined || length > remaining) length = remaining;

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8';

  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
};

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
};

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return fromByteArray(buf)
  } else {
    return fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];

  var i = start;
  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1;

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    res.push(codePoint);
    i += bytesPerSequence;
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000;

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = '';
  var i = 0;
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    );
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F);
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i]);
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i]);
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = '';
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length;
  start = ~~start;
  end = end === undefined ? len : ~~end;

  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) {
    start = len;
  }

  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) {
    end = len;
  }

  if (end < start) end = start;

  var newBuf;
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end);
    newBuf.__proto__ = Buffer.prototype;
  } else {
    var sliceLen = end - start;
    newBuf = new Buffer(sliceLen, undefined);
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start];
    }
  }

  return newBuf
};

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  return val
};

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length);
  }

  var val = this[offset + --byteLength];
  var mul = 1;
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul;
  }

  return val
};

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  return this[offset]
};

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] | (this[offset + 1] << 8)
};

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return (this[offset] << 8) | this[offset + 1]
};

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
};

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
};

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }
  mul *= 0x80;

  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

  return val
};

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var i = byteLength;
  var mul = 1;
  var val = this[offset + --i];
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul;
  }
  mul *= 0x80;

  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

  return val
};

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
};

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset] | (this[offset + 1] << 8);
  return (val & 0x8000) ? val | 0xFFFF0000 : val
};

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset + 1] | (this[offset] << 8);
  return (val & 0x8000) ? val | 0xFFFF0000 : val
};

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
};

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
};

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, true, 23, 4)
};

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, false, 23, 4)
};

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, true, 52, 8)
};

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, false, 52, 8)
};

function checkInt (buf, value, offset, ext, max, min) {
  if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var mul = 1;
  var i = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF;
  }

  return offset + byteLength
};

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var i = byteLength - 1;
  var mul = 1;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF;
  }

  return offset + byteLength
};

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  this[offset] = (value & 0xff);
  return offset + 1
};

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8;
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
  } else {
    objectWriteUInt16(this, value, offset, true);
  }
  return offset + 2
};

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
  } else {
    objectWriteUInt16(this, value, offset, false);
  }
  return offset + 2
};

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24);
    this[offset + 2] = (value >>> 16);
    this[offset + 1] = (value >>> 8);
    this[offset] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, true);
  }
  return offset + 4
};

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, false);
  }
  return offset + 4
};

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);

    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
  }

  return offset + byteLength
};

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);

    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = byteLength - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
  }

  return offset + byteLength
};

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  if (value < 0) value = 0xff + value + 1;
  this[offset] = (value & 0xff);
  return offset + 1
};

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
  } else {
    objectWriteUInt16(this, value, offset, true);
  }
  return offset + 2
};

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
  } else {
    objectWriteUInt16(this, value, offset, false);
  }
  return offset + 2
};

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
    this[offset + 2] = (value >>> 16);
    this[offset + 3] = (value >>> 24);
  } else {
    objectWriteUInt32(this, value, offset, true);
  }
  return offset + 4
};

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (value < 0) value = 0xffffffff + value + 1;
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, false);
  }
  return offset + 4
};

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4);
  }
  write(buf, value, offset, littleEndian, 23, 4);
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
};

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
};

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8);
  }
  write(buf, value, offset, littleEndian, 52, 8);
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
};

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
};

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start;

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length;
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start;
  }

  var len = end - start;
  var i;

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start];
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    );
  }

  return len
};

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === 'string') {
      encoding = end;
      end = this.length;
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0);
      if (code < 256) {
        val = code;
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255;
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0;
  end = end === undefined ? this.length : end >>> 0;

  if (!val) val = 0;

  var i;
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    var bytes = internalIsBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString());
    var len = bytes.length;
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }

  return this
};

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '');
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '=';
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue
        }

        // valid lead
        leadSurrogate = codePoint;

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        leadSurrogate = codePoint;
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
    }

    leadSurrogate = null;

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      );
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF);
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo;
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }

  return byteArray
}


function base64ToBytes (str) {
  return toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i];
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}


// the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
function isBuffer$1(obj) {
  return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
}

function isFastBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
}

// shim for using process in browser
// based off https://github.com/defunctzombie/node-process/blob/master/browser.js

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
var cachedSetTimeout = defaultSetTimout;
var cachedClearTimeout = defaultClearTimeout;
if (typeof global$1.setTimeout === 'function') {
    cachedSetTimeout = setTimeout;
}
if (typeof global$1.clearTimeout === 'function') {
    cachedClearTimeout = clearTimeout;
}

function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}
function nextTick(fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
}
// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
var title = 'browser';
var platform = 'browser';
var browser = true;
var env = {};
var argv = [];
var version = ''; // empty string to avoid regexp issues
var versions = {};
var release = {};
var config = {};

function noop() {}

var on = noop;
var addListener = noop;
var once = noop;
var off = noop;
var removeListener = noop;
var removeAllListeners = noop;
var emit = noop;

function binding(name) {
    throw new Error('process.binding is not supported');
}

function cwd () { return '/' }
function chdir (dir) {
    throw new Error('process.chdir is not supported');
}function umask() { return 0; }

// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
var performance$1 = global$1.performance || {};
var performanceNow =
  performance$1.now        ||
  performance$1.mozNow     ||
  performance$1.msNow      ||
  performance$1.oNow       ||
  performance$1.webkitNow  ||
  function(){ return (new Date()).getTime() };

// generate timestamp or delta
// see http://nodejs.org/api/process.html#process_process_hrtime
function hrtime(previousTimestamp){
  var clocktime = performanceNow.call(performance$1)*1e-3;
  var seconds = Math.floor(clocktime);
  var nanoseconds = Math.floor((clocktime%1)*1e9);
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0];
    nanoseconds = nanoseconds - previousTimestamp[1];
    if (nanoseconds<0) {
      seconds--;
      nanoseconds += 1e9;
    }
  }
  return [seconds,nanoseconds]
}

var startTime = new Date();
function uptime() {
  var currentTime = new Date();
  var dif = currentTime - startTime;
  return dif / 1000;
}

var browser$1 = {
  nextTick: nextTick,
  title: title,
  browser: browser,
  env: env,
  argv: argv,
  version: version,
  versions: versions,
  on: on,
  addListener: addListener,
  once: once,
  off: off,
  removeListener: removeListener,
  removeAllListeners: removeAllListeners,
  emit: emit,
  binding: binding,
  cwd: cwd,
  chdir: chdir,
  umask: umask,
  hrtime: hrtime,
  platform: platform,
  release: release,
  config: config,
  uptime: uptime
};

var process = browser$1;

var inherits;
if (typeof Object.create === 'function'){
  inherits = function inherits(ctor, superCtor) {
    // implementation from standard node.js 'util' module
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  inherits = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    var TempCtor = function () {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
  };
}
var inherits$1 = inherits;

var formatRegExp = /%[sdj%]/g;
function format(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
}

// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
function deprecate(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global$1.process)) {
    return function() {
      return deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

var debugs = {};
var debugEnviron;
function debuglog(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = 0;
      debugs[set] = function() {
        var msg = format.apply(null, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
}

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    _extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var length = output.reduce(function(prev, cur) {
    if (cur.indexOf('\n') >= 0) ;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}

function isBoolean(arg) {
  return typeof arg === 'boolean';
}

function isNull(arg) {
  return arg === null;
}

function isNullOrUndefined(arg) {
  return arg == null;
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isString(arg) {
  return typeof arg === 'string';
}

function isSymbol(arg) {
  return typeof arg === 'symbol';
}

function isUndefined(arg) {
  return arg === void 0;
}

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}

function isFunction(arg) {
  return typeof arg === 'function';
}

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}

function isBuffer(maybeBuf) {
  return Buffer.isBuffer(maybeBuf);
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
function log() {
  console.log('%s - %s', timestamp(), format.apply(null, arguments));
}

function _extend(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

var util$1 = {
  inherits: inherits$1,
  _extend: _extend,
  log: log,
  isBuffer: isBuffer,
  isPrimitive: isPrimitive,
  isFunction: isFunction,
  isError: isError,
  isDate: isDate,
  isObject: isObject,
  isRegExp: isRegExp,
  isUndefined: isUndefined,
  isSymbol: isSymbol,
  isString: isString,
  isNumber: isNumber,
  isNullOrUndefined: isNullOrUndefined,
  isNull: isNull,
  isBoolean: isBoolean,
  isArray: isArray,
  inspect: inspect,
  deprecate: deprecate,
  format: format,
  debuglog: debuglog
};

var util$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    format: format,
    deprecate: deprecate,
    debuglog: debuglog,
    inspect: inspect,
    isArray: isArray,
    isBoolean: isBoolean,
    isNull: isNull,
    isNullOrUndefined: isNullOrUndefined,
    isNumber: isNumber,
    isString: isString,
    isSymbol: isSymbol,
    isUndefined: isUndefined,
    isRegExp: isRegExp,
    isObject: isObject,
    isDate: isDate,
    isError: isError,
    isFunction: isFunction,
    isPrimitive: isPrimitive,
    isBuffer: isBuffer,
    log: log,
    inherits: inherits$1,
    _extend: _extend,
    'default': util$1
});

var require$$0 = /*@__PURE__*/getAugmentedNamespace(util$2);

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

class Hook$9 {
	constructor(args) {
		if (!Array.isArray(args)) args = [];
		this._args = args;
		this.taps = [];
		this.interceptors = [];
		this.call = this._call;
		this.promise = this._promise;
		this.callAsync = this._callAsync;
		this._x = undefined;
	}

	compile(options) {
		throw new Error("Abstract: should be overriden");
	}

	_createCall(type) {
		return this.compile({
			taps: this.taps,
			interceptors: this.interceptors,
			args: this._args,
			type: type
		});
	}

	tap(options, fn) {
		if (typeof options === "string") options = { name: options };
		if (typeof options !== "object" || options === null)
			throw new Error(
				"Invalid arguments to tap(options: Object, fn: function)"
			);
		options = Object.assign({ type: "sync", fn: fn }, options);
		if (typeof options.name !== "string" || options.name === "")
			throw new Error("Missing name for tap");
		options = this._runRegisterInterceptors(options);
		this._insert(options);
	}

	tapAsync(options, fn) {
		if (typeof options === "string") options = { name: options };
		if (typeof options !== "object" || options === null)
			throw new Error(
				"Invalid arguments to tapAsync(options: Object, fn: function)"
			);
		options = Object.assign({ type: "async", fn: fn }, options);
		if (typeof options.name !== "string" || options.name === "")
			throw new Error("Missing name for tapAsync");
		options = this._runRegisterInterceptors(options);
		this._insert(options);
	}

	tapPromise(options, fn) {
		if (typeof options === "string") options = { name: options };
		if (typeof options !== "object" || options === null)
			throw new Error(
				"Invalid arguments to tapPromise(options: Object, fn: function)"
			);
		options = Object.assign({ type: "promise", fn: fn }, options);
		if (typeof options.name !== "string" || options.name === "")
			throw new Error("Missing name for tapPromise");
		options = this._runRegisterInterceptors(options);
		this._insert(options);
	}

	_runRegisterInterceptors(options) {
		for (const interceptor of this.interceptors) {
			if (interceptor.register) {
				const newOptions = interceptor.register(options);
				if (newOptions !== undefined) options = newOptions;
			}
		}
		return options;
	}

	withOptions(options) {
		const mergeOptions = opt =>
			Object.assign({}, options, typeof opt === "string" ? { name: opt } : opt);

		// Prevent creating endless prototype chains
		options = Object.assign({}, options, this._withOptions);
		const base = this._withOptionsBase || this;
		const newHook = Object.create(base);

		(newHook.tapAsync = (opt, fn) => base.tapAsync(mergeOptions(opt), fn)),
			(newHook.tap = (opt, fn) => base.tap(mergeOptions(opt), fn));
		newHook.tapPromise = (opt, fn) => base.tapPromise(mergeOptions(opt), fn);
		newHook._withOptions = options;
		newHook._withOptionsBase = base;
		return newHook;
	}

	isUsed() {
		return this.taps.length > 0 || this.interceptors.length > 0;
	}

	intercept(interceptor) {
		this._resetCompilation();
		this.interceptors.push(Object.assign({}, interceptor));
		if (interceptor.register) {
			for (let i = 0; i < this.taps.length; i++)
				this.taps[i] = interceptor.register(this.taps[i]);
		}
	}

	_resetCompilation() {
		this.call = this._call;
		this.callAsync = this._callAsync;
		this.promise = this._promise;
	}

	_insert(item) {
		this._resetCompilation();
		let before;
		if (typeof item.before === "string") before = new Set([item.before]);
		else if (Array.isArray(item.before)) {
			before = new Set(item.before);
		}
		let stage = 0;
		if (typeof item.stage === "number") stage = item.stage;
		let i = this.taps.length;
		while (i > 0) {
			i--;
			const x = this.taps[i];
			this.taps[i + 1] = x;
			const xStage = x.stage || 0;
			if (before) {
				if (before.has(x.name)) {
					before.delete(x.name);
					continue;
				}
				if (before.size > 0) {
					continue;
				}
			}
			if (xStage > stage) {
				continue;
			}
			i++;
			break;
		}
		this.taps[i] = item;
	}
}

function createCompileDelegate(name, type) {
	return function lazyCompileHook(...args) {
		this[name] = this._createCall(type);
		return this[name](...args);
	};
}

Object.defineProperties(Hook$9.prototype, {
	_call: {
		value: createCompileDelegate("call", "sync"),
		configurable: true,
		writable: true
	},
	_promise: {
		value: createCompileDelegate("promise", "promise"),
		configurable: true,
		writable: true
	},
	_callAsync: {
		value: createCompileDelegate("callAsync", "async"),
		configurable: true,
		writable: true
	}
});

var Hook_1 = Hook$9;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

class HookCodeFactory$9 {
	constructor(config) {
		this.config = config;
		this.options = undefined;
		this._args = undefined;
	}

	create(options) {
		this.init(options);
		let fn;
		switch (this.options.type) {
			case "sync":
				fn = new Function(
					this.args(),
					'"use strict";\n' +
						this.header() +
						this.content({
							onError: err => `throw ${err};\n`,
							onResult: result => `return ${result};\n`,
							resultReturns: true,
							onDone: () => "",
							rethrowIfPossible: true
						})
				);
				break;
			case "async":
				fn = new Function(
					this.args({
						after: "_callback"
					}),
					'"use strict";\n' +
						this.header() +
						this.content({
							onError: err => `_callback(${err});\n`,
							onResult: result => `_callback(null, ${result});\n`,
							onDone: () => "_callback();\n"
						})
				);
				break;
			case "promise":
				let errorHelperUsed = false;
				const content = this.content({
					onError: err => {
						errorHelperUsed = true;
						return `_error(${err});\n`;
					},
					onResult: result => `_resolve(${result});\n`,
					onDone: () => "_resolve();\n"
				});
				let code = "";
				code += '"use strict";\n';
				code += "return new Promise((_resolve, _reject) => {\n";
				if (errorHelperUsed) {
					code += "var _sync = true;\n";
					code += "function _error(_err) {\n";
					code += "if(_sync)\n";
					code += "_resolve(Promise.resolve().then(() => { throw _err; }));\n";
					code += "else\n";
					code += "_reject(_err);\n";
					code += "};\n";
				}
				code += this.header();
				code += content;
				if (errorHelperUsed) {
					code += "_sync = false;\n";
				}
				code += "});\n";
				fn = new Function(this.args(), code);
				break;
		}
		this.deinit();
		return fn;
	}

	setup(instance, options) {
		instance._x = options.taps.map(t => t.fn);
	}

	/**
	 * @param {{ type: "sync" | "promise" | "async", taps: Array<Tap>, interceptors: Array<Interceptor> }} options
	 */
	init(options) {
		this.options = options;
		this._args = options.args.slice();
	}

	deinit() {
		this.options = undefined;
		this._args = undefined;
	}

	header() {
		let code = "";
		if (this.needContext()) {
			code += "var _context = {};\n";
		} else {
			code += "var _context;\n";
		}
		code += "var _x = this._x;\n";
		if (this.options.interceptors.length > 0) {
			code += "var _taps = this.taps;\n";
			code += "var _interceptors = this.interceptors;\n";
		}
		for (let i = 0; i < this.options.interceptors.length; i++) {
			const interceptor = this.options.interceptors[i];
			if (interceptor.call) {
				code += `${this.getInterceptor(i)}.call(${this.args({
					before: interceptor.context ? "_context" : undefined
				})});\n`;
			}
		}
		return code;
	}

	needContext() {
		for (const tap of this.options.taps) if (tap.context) return true;
		return false;
	}

	callTap(tapIndex, { onError, onResult, onDone, rethrowIfPossible }) {
		let code = "";
		let hasTapCached = false;
		for (let i = 0; i < this.options.interceptors.length; i++) {
			const interceptor = this.options.interceptors[i];
			if (interceptor.tap) {
				if (!hasTapCached) {
					code += `var _tap${tapIndex} = ${this.getTap(tapIndex)};\n`;
					hasTapCached = true;
				}
				code += `${this.getInterceptor(i)}.tap(${
					interceptor.context ? "_context, " : ""
				}_tap${tapIndex});\n`;
			}
		}
		code += `var _fn${tapIndex} = ${this.getTapFn(tapIndex)};\n`;
		const tap = this.options.taps[tapIndex];
		switch (tap.type) {
			case "sync":
				if (!rethrowIfPossible) {
					code += `var _hasError${tapIndex} = false;\n`;
					code += "try {\n";
				}
				if (onResult) {
					code += `var _result${tapIndex} = _fn${tapIndex}(${this.args({
						before: tap.context ? "_context" : undefined
					})});\n`;
				} else {
					code += `_fn${tapIndex}(${this.args({
						before: tap.context ? "_context" : undefined
					})});\n`;
				}
				if (!rethrowIfPossible) {
					code += "} catch(_err) {\n";
					code += `_hasError${tapIndex} = true;\n`;
					code += onError("_err");
					code += "}\n";
					code += `if(!_hasError${tapIndex}) {\n`;
				}
				if (onResult) {
					code += onResult(`_result${tapIndex}`);
				}
				if (onDone) {
					code += onDone();
				}
				if (!rethrowIfPossible) {
					code += "}\n";
				}
				break;
			case "async":
				let cbCode = "";
				if (onResult) cbCode += `(_err${tapIndex}, _result${tapIndex}) => {\n`;
				else cbCode += `_err${tapIndex} => {\n`;
				cbCode += `if(_err${tapIndex}) {\n`;
				cbCode += onError(`_err${tapIndex}`);
				cbCode += "} else {\n";
				if (onResult) {
					cbCode += onResult(`_result${tapIndex}`);
				}
				if (onDone) {
					cbCode += onDone();
				}
				cbCode += "}\n";
				cbCode += "}";
				code += `_fn${tapIndex}(${this.args({
					before: tap.context ? "_context" : undefined,
					after: cbCode
				})});\n`;
				break;
			case "promise":
				code += `var _hasResult${tapIndex} = false;\n`;
				code += `var _promise${tapIndex} = _fn${tapIndex}(${this.args({
					before: tap.context ? "_context" : undefined
				})});\n`;
				code += `if (!_promise${tapIndex} || !_promise${tapIndex}.then)\n`;
				code += `  throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise${tapIndex} + ')');\n`;
				code += `_promise${tapIndex}.then(_result${tapIndex} => {\n`;
				code += `_hasResult${tapIndex} = true;\n`;
				if (onResult) {
					code += onResult(`_result${tapIndex}`);
				}
				if (onDone) {
					code += onDone();
				}
				code += `}, _err${tapIndex} => {\n`;
				code += `if(_hasResult${tapIndex}) throw _err${tapIndex};\n`;
				code += onError(`_err${tapIndex}`);
				code += "});\n";
				break;
		}
		return code;
	}

	callTapsSeries({
		onError,
		onResult,
		resultReturns,
		onDone,
		doneReturns,
		rethrowIfPossible
	}) {
		if (this.options.taps.length === 0) return onDone();
		const firstAsync = this.options.taps.findIndex(t => t.type !== "sync");
		const somethingReturns = resultReturns || doneReturns || false;
		let code = "";
		let current = onDone;
		for (let j = this.options.taps.length - 1; j >= 0; j--) {
			const i = j;
			const unroll = current !== onDone && this.options.taps[i].type !== "sync";
			if (unroll) {
				code += `function _next${i}() {\n`;
				code += current();
				code += `}\n`;
				current = () => `${somethingReturns ? "return " : ""}_next${i}();\n`;
			}
			const done = current;
			const doneBreak = skipDone => {
				if (skipDone) return "";
				return onDone();
			};
			const content = this.callTap(i, {
				onError: error => onError(i, error, done, doneBreak),
				onResult:
					onResult &&
					(result => {
						return onResult(i, result, done, doneBreak);
					}),
				onDone: !onResult && done,
				rethrowIfPossible:
					rethrowIfPossible && (firstAsync < 0 || i < firstAsync)
			});
			current = () => content;
		}
		code += current();
		return code;
	}

	callTapsLooping({ onError, onDone, rethrowIfPossible }) {
		if (this.options.taps.length === 0) return onDone();
		const syncOnly = this.options.taps.every(t => t.type === "sync");
		let code = "";
		if (!syncOnly) {
			code += "var _looper = () => {\n";
			code += "var _loopAsync = false;\n";
		}
		code += "var _loop;\n";
		code += "do {\n";
		code += "_loop = false;\n";
		for (let i = 0; i < this.options.interceptors.length; i++) {
			const interceptor = this.options.interceptors[i];
			if (interceptor.loop) {
				code += `${this.getInterceptor(i)}.loop(${this.args({
					before: interceptor.context ? "_context" : undefined
				})});\n`;
			}
		}
		code += this.callTapsSeries({
			onError,
			onResult: (i, result, next, doneBreak) => {
				let code = "";
				code += `if(${result} !== undefined) {\n`;
				code += "_loop = true;\n";
				if (!syncOnly) code += "if(_loopAsync) _looper();\n";
				code += doneBreak(true);
				code += `} else {\n`;
				code += next();
				code += `}\n`;
				return code;
			},
			onDone:
				onDone &&
				(() => {
					let code = "";
					code += "if(!_loop) {\n";
					code += onDone();
					code += "}\n";
					return code;
				}),
			rethrowIfPossible: rethrowIfPossible && syncOnly
		});
		code += "} while(_loop);\n";
		if (!syncOnly) {
			code += "_loopAsync = true;\n";
			code += "};\n";
			code += "_looper();\n";
		}
		return code;
	}

	callTapsParallel({
		onError,
		onResult,
		onDone,
		rethrowIfPossible,
		onTap = (i, run) => run()
	}) {
		if (this.options.taps.length <= 1) {
			return this.callTapsSeries({
				onError,
				onResult,
				onDone,
				rethrowIfPossible
			});
		}
		let code = "";
		code += "do {\n";
		code += `var _counter = ${this.options.taps.length};\n`;
		if (onDone) {
			code += "var _done = () => {\n";
			code += onDone();
			code += "};\n";
		}
		for (let i = 0; i < this.options.taps.length; i++) {
			const done = () => {
				if (onDone) return "if(--_counter === 0) _done();\n";
				else return "--_counter;";
			};
			const doneBreak = skipDone => {
				if (skipDone || !onDone) return "_counter = 0;\n";
				else return "_counter = 0;\n_done();\n";
			};
			code += "if(_counter <= 0) break;\n";
			code += onTap(
				i,
				() =>
					this.callTap(i, {
						onError: error => {
							let code = "";
							code += "if(_counter > 0) {\n";
							code += onError(i, error, done, doneBreak);
							code += "}\n";
							return code;
						},
						onResult:
							onResult &&
							(result => {
								let code = "";
								code += "if(_counter > 0) {\n";
								code += onResult(i, result, done, doneBreak);
								code += "}\n";
								return code;
							}),
						onDone:
							!onResult &&
							(() => {
								return done();
							}),
						rethrowIfPossible
					}),
				done,
				doneBreak
			);
		}
		code += "} while(false);\n";
		return code;
	}

	args({ before, after } = {}) {
		let allArgs = this._args;
		if (before) allArgs = [before].concat(allArgs);
		if (after) allArgs = allArgs.concat(after);
		if (allArgs.length === 0) {
			return "";
		} else {
			return allArgs.join(", ");
		}
	}

	getTapFn(idx) {
		return `_x[${idx}]`;
	}

	getTap(idx) {
		return `_taps[${idx}]`;
	}

	getInterceptor(idx) {
		return `_interceptors[${idx}]`;
	}
}

var HookCodeFactory_1 = HookCodeFactory$9;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

const Hook$8 = Hook_1;
const HookCodeFactory$8 = HookCodeFactory_1;

class SyncBailHookCodeFactory extends HookCodeFactory$8 {
	content({ onError, onResult, resultReturns, onDone, rethrowIfPossible }) {
		return this.callTapsSeries({
			onError: (i, err) => onError(err),
			onResult: (i, result, next) =>
				`if(${result} !== undefined) {\n${onResult(
					result
				)};\n} else {\n${next()}}\n`,
			resultReturns,
			onDone,
			rethrowIfPossible
		});
	}
}

const factory$8 = new SyncBailHookCodeFactory();

class SyncBailHook$1 extends Hook$8 {
	tapAsync() {
		throw new Error("tapAsync is not supported on a SyncBailHook");
	}

	tapPromise() {
		throw new Error("tapPromise is not supported on a SyncBailHook");
	}

	compile(options) {
		factory$8.setup(this, options);
		return factory$8.create(options);
	}
}

var SyncBailHook_1 = SyncBailHook$1;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

const util = require$$0;
const SyncBailHook = SyncBailHook_1;

function Tapable() {
	this._pluginCompat = new SyncBailHook(["options"]);
	this._pluginCompat.tap(
		{
			name: "Tapable camelCase",
			stage: 100
		},
		options => {
			options.names.add(
				options.name.replace(/[- ]([a-z])/g, (str, ch) => ch.toUpperCase())
			);
		}
	);
	this._pluginCompat.tap(
		{
			name: "Tapable this.hooks",
			stage: 200
		},
		options => {
			let hook;
			for (const name of options.names) {
				hook = this.hooks[name];
				if (hook !== undefined) {
					break;
				}
			}
			if (hook !== undefined) {
				const tapOpt = {
					name: options.fn.name || "unnamed compat plugin",
					stage: options.stage || 0
				};
				if (options.async) hook.tapAsync(tapOpt, options.fn);
				else hook.tap(tapOpt, options.fn);
				return true;
			}
		}
	);
}
var Tapable_1 = Tapable;

Tapable.addCompatLayer = function addCompatLayer(instance) {
	Tapable.call(instance);
	instance.plugin = Tapable.prototype.plugin;
	instance.apply = Tapable.prototype.apply;
};

Tapable.prototype.plugin = util.deprecate(function plugin(name, fn) {
	if (Array.isArray(name)) {
		name.forEach(function(name) {
			this.plugin(name, fn);
		}, this);
		return;
	}
	const result = this._pluginCompat.call({
		name: name,
		fn: fn,
		names: new Set([name])
	});
	if (!result) {
		throw new Error(
			`Plugin could not be registered at '${name}'. Hook was not found.\n` +
				"BREAKING CHANGE: There need to exist a hook at 'this.hooks'. " +
				"To create a compatibility layer for this hook, hook into 'this._pluginCompat'."
		);
	}
}, "Tapable.plugin is deprecated. Use new API on `.hooks` instead");

Tapable.prototype.apply = util.deprecate(function apply() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].apply(this);
	}
}, "Tapable.apply is deprecated. Call apply on the plugin directly instead");

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

const Hook$7 = Hook_1;
const HookCodeFactory$7 = HookCodeFactory_1;

class SyncHookCodeFactory extends HookCodeFactory$7 {
	content({ onError, onDone, rethrowIfPossible }) {
		return this.callTapsSeries({
			onError: (i, err) => onError(err),
			onDone,
			rethrowIfPossible
		});
	}
}

const factory$7 = new SyncHookCodeFactory();

class SyncHook$1 extends Hook$7 {
	tapAsync() {
		throw new Error("tapAsync is not supported on a SyncHook");
	}

	tapPromise() {
		throw new Error("tapPromise is not supported on a SyncHook");
	}

	compile(options) {
		factory$7.setup(this, options);
		return factory$7.create(options);
	}
}

var SyncHook_1 = SyncHook$1;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

const Hook$6 = Hook_1;
const HookCodeFactory$6 = HookCodeFactory_1;

class SyncWaterfallHookCodeFactory extends HookCodeFactory$6 {
	content({ onError, onResult, resultReturns, rethrowIfPossible }) {
		return this.callTapsSeries({
			onError: (i, err) => onError(err),
			onResult: (i, result, next) => {
				let code = "";
				code += `if(${result} !== undefined) {\n`;
				code += `${this._args[0]} = ${result};\n`;
				code += `}\n`;
				code += next();
				return code;
			},
			onDone: () => onResult(this._args[0]),
			doneReturns: resultReturns,
			rethrowIfPossible
		});
	}
}

const factory$6 = new SyncWaterfallHookCodeFactory();

class SyncWaterfallHook extends Hook$6 {
	constructor(args) {
		super(args);
		if (args.length < 1)
			throw new Error("Waterfall hooks must have at least one argument");
	}

	tapAsync() {
		throw new Error("tapAsync is not supported on a SyncWaterfallHook");
	}

	tapPromise() {
		throw new Error("tapPromise is not supported on a SyncWaterfallHook");
	}

	compile(options) {
		factory$6.setup(this, options);
		return factory$6.create(options);
	}
}

var SyncWaterfallHook_1 = SyncWaterfallHook;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

const Hook$5 = Hook_1;
const HookCodeFactory$5 = HookCodeFactory_1;

class SyncLoopHookCodeFactory extends HookCodeFactory$5 {
	content({ onError, onDone, rethrowIfPossible }) {
		return this.callTapsLooping({
			onError: (i, err) => onError(err),
			onDone,
			rethrowIfPossible
		});
	}
}

const factory$5 = new SyncLoopHookCodeFactory();

class SyncLoopHook extends Hook$5 {
	tapAsync() {
		throw new Error("tapAsync is not supported on a SyncLoopHook");
	}

	tapPromise() {
		throw new Error("tapPromise is not supported on a SyncLoopHook");
	}

	compile(options) {
		factory$5.setup(this, options);
		return factory$5.create(options);
	}
}

var SyncLoopHook_1 = SyncLoopHook;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

const Hook$4 = Hook_1;
const HookCodeFactory$4 = HookCodeFactory_1;

class AsyncParallelHookCodeFactory extends HookCodeFactory$4 {
	content({ onError, onDone }) {
		return this.callTapsParallel({
			onError: (i, err, done, doneBreak) => onError(err) + doneBreak(true),
			onDone
		});
	}
}

const factory$4 = new AsyncParallelHookCodeFactory();

class AsyncParallelHook extends Hook$4 {
	compile(options) {
		factory$4.setup(this, options);
		return factory$4.create(options);
	}
}

Object.defineProperties(AsyncParallelHook.prototype, {
	_call: { value: undefined, configurable: true, writable: true }
});

var AsyncParallelHook_1 = AsyncParallelHook;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

const Hook$3 = Hook_1;
const HookCodeFactory$3 = HookCodeFactory_1;

class AsyncParallelBailHookCodeFactory extends HookCodeFactory$3 {
	content({ onError, onResult, onDone }) {
		let code = "";
		code += `var _results = new Array(${this.options.taps.length});\n`;
		code += "var _checkDone = () => {\n";
		code += "for(var i = 0; i < _results.length; i++) {\n";
		code += "var item = _results[i];\n";
		code += "if(item === undefined) return false;\n";
		code += "if(item.result !== undefined) {\n";
		code += onResult("item.result");
		code += "return true;\n";
		code += "}\n";
		code += "if(item.error) {\n";
		code += onError("item.error");
		code += "return true;\n";
		code += "}\n";
		code += "}\n";
		code += "return false;\n";
		code += "}\n";
		code += this.callTapsParallel({
			onError: (i, err, done, doneBreak) => {
				let code = "";
				code += `if(${i} < _results.length && ((_results.length = ${i +
					1}), (_results[${i}] = { error: ${err} }), _checkDone())) {\n`;
				code += doneBreak(true);
				code += "} else {\n";
				code += done();
				code += "}\n";
				return code;
			},
			onResult: (i, result, done, doneBreak) => {
				let code = "";
				code += `if(${i} < _results.length && (${result} !== undefined && (_results.length = ${i +
					1}), (_results[${i}] = { result: ${result} }), _checkDone())) {\n`;
				code += doneBreak(true);
				code += "} else {\n";
				code += done();
				code += "}\n";
				return code;
			},
			onTap: (i, run, done, doneBreak) => {
				let code = "";
				if (i > 0) {
					code += `if(${i} >= _results.length) {\n`;
					code += done();
					code += "} else {\n";
				}
				code += run();
				if (i > 0) code += "}\n";
				return code;
			},
			onDone
		});
		return code;
	}
}

const factory$3 = new AsyncParallelBailHookCodeFactory();

class AsyncParallelBailHook extends Hook$3 {
	compile(options) {
		factory$3.setup(this, options);
		return factory$3.create(options);
	}
}

Object.defineProperties(AsyncParallelBailHook.prototype, {
	_call: { value: undefined, configurable: true, writable: true }
});

var AsyncParallelBailHook_1 = AsyncParallelBailHook;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

const Hook$2 = Hook_1;
const HookCodeFactory$2 = HookCodeFactory_1;

class AsyncSeriesHookCodeFactory extends HookCodeFactory$2 {
	content({ onError, onDone }) {
		return this.callTapsSeries({
			onError: (i, err, next, doneBreak) => onError(err) + doneBreak(true),
			onDone
		});
	}
}

const factory$2 = new AsyncSeriesHookCodeFactory();

class AsyncSeriesHook extends Hook$2 {
	compile(options) {
		factory$2.setup(this, options);
		return factory$2.create(options);
	}
}

Object.defineProperties(AsyncSeriesHook.prototype, {
	_call: { value: undefined, configurable: true, writable: true }
});

var AsyncSeriesHook_1 = AsyncSeriesHook;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

const Hook$1 = Hook_1;
const HookCodeFactory$1 = HookCodeFactory_1;

class AsyncSeriesBailHookCodeFactory extends HookCodeFactory$1 {
	content({ onError, onResult, resultReturns, onDone }) {
		return this.callTapsSeries({
			onError: (i, err, next, doneBreak) => onError(err) + doneBreak(true),
			onResult: (i, result, next) =>
				`if(${result} !== undefined) {\n${onResult(
					result
				)};\n} else {\n${next()}}\n`,
			resultReturns,
			onDone
		});
	}
}

const factory$1 = new AsyncSeriesBailHookCodeFactory();

class AsyncSeriesBailHook extends Hook$1 {
	compile(options) {
		factory$1.setup(this, options);
		return factory$1.create(options);
	}
}

Object.defineProperties(AsyncSeriesBailHook.prototype, {
	_call: { value: undefined, configurable: true, writable: true }
});

var AsyncSeriesBailHook_1 = AsyncSeriesBailHook;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

const Hook = Hook_1;
const HookCodeFactory = HookCodeFactory_1;

class AsyncSeriesWaterfallHookCodeFactory extends HookCodeFactory {
	content({ onError, onResult, onDone }) {
		return this.callTapsSeries({
			onError: (i, err, next, doneBreak) => onError(err) + doneBreak(true),
			onResult: (i, result, next) => {
				let code = "";
				code += `if(${result} !== undefined) {\n`;
				code += `${this._args[0]} = ${result};\n`;
				code += `}\n`;
				code += next();
				return code;
			},
			onDone: () => onResult(this._args[0])
		});
	}
}

const factory = new AsyncSeriesWaterfallHookCodeFactory();

class AsyncSeriesWaterfallHook extends Hook {
	constructor(args) {
		super(args);
		if (args.length < 1)
			throw new Error("Waterfall hooks must have at least one argument");
	}

	compile(options) {
		factory.setup(this, options);
		return factory.create(options);
	}
}

Object.defineProperties(AsyncSeriesWaterfallHook.prototype, {
	_call: { value: undefined, configurable: true, writable: true }
});

var AsyncSeriesWaterfallHook_1 = AsyncSeriesWaterfallHook;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

class HookMap {
	constructor(factory) {
		this._map = new Map();
		this._factory = factory;
		this._interceptors = [];
	}

	get(key) {
		return this._map.get(key);
	}

	for(key) {
		const hook = this.get(key);
		if (hook !== undefined) {
			return hook;
		}
		let newHook = this._factory(key);
		const interceptors = this._interceptors;
		for (let i = 0; i < interceptors.length; i++) {
			newHook = interceptors[i].factory(key, newHook);
		}
		this._map.set(key, newHook);
		return newHook;
	}

	intercept(interceptor) {
		this._interceptors.push(
			Object.assign(
				{
					factory: (key, hook) => hook
				},
				interceptor
			)
		);
	}

	tap(key, options, fn) {
		return this.for(key).tap(options, fn);
	}

	tapAsync(key, options, fn) {
		return this.for(key).tapAsync(options, fn);
	}

	tapPromise(key, options, fn) {
		return this.for(key).tapPromise(options, fn);
	}
}

var HookMap_1 = HookMap;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

class MultiHook {
	constructor(hooks) {
		this.hooks = hooks;
	}

	tap(options, fn) {
		for (const hook of this.hooks) {
			hook.tap(options, fn);
		}
	}

	tapAsync(options, fn) {
		for (const hook of this.hooks) {
			hook.tapAsync(options, fn);
		}
	}

	tapPromise(options, fn) {
		for (const hook of this.hooks) {
			hook.tapPromise(options, fn);
		}
	}

	isUsed() {
		for (const hook of this.hooks) {
			if (hook.isUsed()) return true;
		}
		return false;
	}

	intercept(interceptor) {
		for (const hook of this.hooks) {
			hook.intercept(interceptor);
		}
	}

	withOptions(options) {
		return new MultiHook(this.hooks.map(h => h.withOptions(options)));
	}
}

var MultiHook_1 = MultiHook;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

lib.__esModule = true;
lib.Tapable = Tapable_1;
var SyncHook = lib.SyncHook = SyncHook_1;
lib.SyncBailHook = SyncBailHook_1;
lib.SyncWaterfallHook = SyncWaterfallHook_1;
lib.SyncLoopHook = SyncLoopHook_1;
lib.AsyncParallelHook = AsyncParallelHook_1;
lib.AsyncParallelBailHook = AsyncParallelBailHook_1;
lib.AsyncSeriesHook = AsyncSeriesHook_1;
lib.AsyncSeriesBailHook = AsyncSeriesBailHook_1;
lib.AsyncSeriesWaterfallHook = AsyncSeriesWaterfallHook_1;
lib.HookMap = HookMap_1;
lib.MultiHook = MultiHook_1;

var HookStatus;
(function (HookStatus) {
    HookStatus["beforeRun"] = "beforeRun";
    HookStatus["run"] = "run";
    HookStatus["emit"] = "emit";
    HookStatus["end"] = "end";
})(HookStatus || (HookStatus = {}));
class Pluginable {
    constructor(options) {
        this.defaultPlugins = [];
        this.pluginWatchers = [];
        this.checkHookAvailable = () => {
            try {
                new SyncHook().call();
                return true;
            }
            catch (error) {
                logError(`Plugin hooks is not available in the current env, because ${error}`);
            }
        };
        this.plugin = (type, cb) => {
            const name = this.hooks[type].constructor.name;
            const method = /Async/.test(name) ? 'tapAsync' : 'tap';
            this.hooks[type][method](type, cb);
        };
        this.plugins = [];
        this.initPlugin(options);
        const DEFAULT_HOOKS = {
            beforeRun: new SyncHook(),
            run: new SyncHook(),
            emit: new SyncHook(['data']),
            end: new SyncHook()
        };
        const HOOKS = this.checkHookAvailable()
            ? DEFAULT_HOOKS
            : Object.keys(DEFAULT_HOOKS).reduce((obj, key) => {
                return Object.assign(Object.assign({}, obj), { [key]: () => { } });
            }, {});
        this.hooks = HOOKS;
    }
    use(plugin) {
        this.plugins.push(plugin);
    }
    initPlugin(options) {
        const { plugins } = options || {};
        this.plugins.push(...this.defaultPlugins, ...(plugins || []));
    }
    loadPlugins() {
        this.plugins.forEach(plugin => {
            plugin.apply.call(plugin, this);
        });
    }
    addWatcher(watcher) {
        this.pluginWatchers.push(watcher);
    }
}

class VideoWatcher extends Watcher {
    init() {
        const recordOptions = this.recordOptions;
        const { video } = recordOptions;
        this.fps = video.fps;
        this.watchVideos();
    }
    watchVideos() {
        const videoElements = document.getElementsByTagName('video');
        Array.from(videoElements).forEach(videoElement => {
            this.recordVideo(videoElement);
        });
    }
    recordVideo(videoElement) {
        const canvas = this.createMirrorCanvas(videoElement);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        const resizeHandle = () => {
            this.resizeCanvasSize(canvas, videoElement);
        };
        videoElement.addEventListener('resize', resizeHandle);
        function drawCanvas(videoElement, ctx) {
            const canvas = ctx.canvas;
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        }
        drawCanvas(videoElement, ctx);
        const recorder = new MediaRecorder(canvas.captureStream(60), {
            mimeType: 'video/webm;codecs=vp9',
            bitsPerSecond: 1000000
        });
        recorder.ondataavailable = (e) => __awaiter(this, void 0, void 0, function* () {
            const blob = e.data;
            const buffer = yield blob.arrayBuffer();
            const dataStr = bufferArrayToBase64(buffer);
            const data = {
                id: nodeStore.getNodeId(videoElement),
                dataStr
            };
            this.emitData(RecordType.VIDEO, data);
        });
        const stopRecord = () => {
            recorder.state === 'recording' && recorder.stop();
        };
        let isRecording = false;
        const drawRAF = new AnimationFrame(() => drawCanvas(videoElement, ctx), this.fps);
        const triggerDraw = debounce(() => {
            isRecording = !isRecording;
            if (isRecording) {
                drawRAF.start();
                recorder.start(1000 / this.fps);
            }
            else {
                drawRAF.stop();
                stopRecord();
            }
        }, 300, { isTrailing: true, isImmediate: true });
        videoElement.addEventListener('timeupdate', triggerDraw);
        this.uninstall(() => {
            stopRecord();
            videoElement.removeEventListener('timeupdate', triggerDraw);
            videoElement.removeEventListener('resize', resizeHandle);
        });
    }
    createMirrorCanvas(videoElement) {
        const canvas = document.createElement('canvas', false);
        this.resizeCanvasSize(canvas, videoElement);
        return canvas;
    }
    resizeCanvasSize(canvas, el) {
        const { width, height } = el.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
    }
}

var RecorderStatus;
(function (RecorderStatus) {
    RecorderStatus["RUNNING"] = "running";
    RecorderStatus["PAUSE"] = "pause";
    RecorderStatus["HALT"] = "halt";
})(RecorderStatus || (RecorderStatus = {}));

class Recorder {
    constructor(options) {
        this.status = RecorderStatus.PAUSE;
        this.onData = tempEmptyFn;
        this.destroy = tempEmptyPromise;
        this.pause = tempEmptyPromise;
        this.record = tempEmptyPromise;
        this.use = tempEmptyFn;
        const recorder = new RecorderModule(options);
        Object.keys(this).forEach((key) => {
            Object.defineProperty(this, key, {
                get() {
                    return typeof recorder[key] === 'function'
                        ? recorder[key].bind(recorder)
                        : recorder[key];
                }
            });
        });
    }
}
class RecorderModule extends Pluginable {
    constructor(options) {
        super(options);
        this.defaultMiddleware = [];
        this.destroyStore = new Set();
        this.listenStore = new Set();
        this.middleware = [...this.defaultMiddleware];
        this.watchersInstance = new Map();
        this.watchesReadyPromise = new Promise(resolve => (this.watcherResolve = resolve));
        this.status = RecorderStatus.PAUSE;
        const opts = this.initOptions(options);
        opts.rootContext = opts.rootContext || opts.context;
        this.options = opts;
        this.watchers = this.getWatchers();
        this.init();
    }
    initOptions(options) {
        const opts = Object.assign(Object.assign({}, RecorderModule.defaultRecordOpts), options);
        if (opts.video === true) {
            opts.video = { fps: 24 };
        }
        else if (opts.video && 'fps' in opts.video) {
            if (opts.video.fps > 24) {
                opts.video.fps = 24;
            }
        }
        return opts;
    }
    init() {
        this.startTime = getTime();
        const options = this.options;
        this.loadPlugins();
        this.hooks.beforeRun.call(this);
        this.record(options);
        this.hooks.run.call(this);
    }
    onData(fn) {
        this.middleware.unshift(fn);
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.status === RecorderStatus.HALT)
                return;
            yield this.pause();
            this.status = RecorderStatus.HALT;
            return;
        });
    }
    pause() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.status === RecorderStatus.RUNNING) {
                this.status = RecorderStatus.PAUSE;
                yield this.cancelListener();
                this.destroyStore.forEach(un => un());
                this.destroyStore.clear();
            }
            return;
        });
    }
    cancelListener() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.watchesReadyPromise;
            this.listenStore.forEach(un => un());
            this.listenStore.clear();
            nodeStore.reset();
        });
    }
    getWatchers() {
        const { video, audio, disableWatchers } = this.options;
        const watchersList = [Snapshot, ...Object.values(watchers)];
        if (audio) {
            watchersList.push(AudioWatcher);
        }
        if (video) {
            watchersList.push(VideoWatcher);
        }
        return watchersList.filter(watcher => {
            return !~disableWatchers.indexOf(watcher.name);
        });
    }
    record(options) {
        if (this.status === RecorderStatus.PAUSE) {
            const opts = Object.assign(Object.assign({}, RecorderModule.defaultRecordOpts), options);
            this.startRecord((opts.context.G_RECORD_OPTIONS = opts));
            return;
        }
    }
    startRecord(options) {
        return __awaiter(this, void 0, void 0, function* () {
            this.status = RecorderStatus.RUNNING;
            let activeWatchers = [...this.watchers, ...this.pluginWatchers];
            const isSameCtx = options.context === this.options.rootContext;
            if (isSameCtx) ;
            else {
                activeWatchers = [Snapshot, ...Object.values(baseWatchers)];
            }
            const onEmit = (options) => {
                const emitTasks = [];
                const { middleware: rootMiddleware } = this.options.rootRecorder || { middleware: [] };
                const execTasksChain = (() => {
                    let concurrency = 0;
                    const MAX_CONCURRENCY = 1;
                    return () => __awaiter(this, void 0, void 0, function* () {
                        if (concurrency >= MAX_CONCURRENCY) {
                            return;
                        }
                        concurrency++;
                        while (emitTasks.length) {
                            const record = emitTasks.shift();
                            yield delay(0);
                            if (this.status === RecorderStatus.RUNNING) {
                                const middleware = [...rootMiddleware, ...this.middleware];
                                yield this.connectCompose(middleware)(record);
                                this.hooks.emit.call(record);
                            }
                        }
                        concurrency--;
                    });
                })();
                return (data) => {
                    if (!data)
                        return;
                    emitTasks.push(data);
                    execTasksChain();
                };
            };
            const isInRoot = options.context === this.options.rootContext;
            const emit = onEmit();
            const headData = getHeadData();
            const relatedId = isInRoot ? headData.relatedId : options.rootContext.G_RECORD_RELATED_ID;
            options.context.G_RECORD_RELATED_ID = relatedId;
            if (isInRoot) {
                emit({
                    type: RecordType.HEAD,
                    data: headData,
                    relatedId,
                    time: getTime()
                });
            }
            activeWatchers.forEach(Watcher => {
                try {
                    const watcher = new Watcher({
                        recorder: this,
                        context: options && options.context,
                        listenStore: this.listenStore,
                        relatedId,
                        emit,
                        watchers: this.watchersInstance
                    });
                    this.watchersInstance.set(Watcher.name, watcher);
                }
                catch (e) {
                    logError(e);
                }
            });
            if (isInRoot && options.emitLocationImmediate) {
                const locationInstance = this.watchersInstance.get(LocationWatcher.name);
                locationInstance === null || locationInstance === void 0 ? void 0 : locationInstance.emitOne();
            }
            this.watcherResolve();
            yield this.recordSubIFrames(options.context);
        });
    }
    waitingSubIFramesLoaded(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const frames = context.frames;
            const validFrames = Array.from(frames)
                .filter(frame => {
                try {
                    return frame.frameElement && frame.frameElement.getAttribute('src');
                }
                catch (e) {
                    logError(e);
                    return false;
                }
            })
                .map((frame) => __awaiter(this, void 0, void 0, function* () {
                yield delay(0);
                return yield new Promise(resolve => {
                    if (frame.document.readyState === 'complete') {
                        resolve(frame);
                    }
                    else {
                        frame.addEventListener('load', () => resolve(frame));
                    }
                });
            }));
            if (!validFrames.length) {
                return Promise.resolve([]);
            }
            return Promise.all(validFrames);
        });
    }
    waitingIFrameLoaded(frame) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                frame.document && frame.frameElement && frame.frameElement.getAttribute('src');
            }
            catch (e) {
                logError(e);
                return;
            }
            return new Promise(resolve => {
                const timer = window.setInterval(() => {
                    try {
                        if (frame.document) {
                            clearInterval(timer);
                            resolve(frame);
                        }
                    }
                    catch (e) {
                        logError(e);
                        clearInterval(timer);
                        resolve(undefined);
                    }
                }, 200);
            });
        });
    }
    recordSubIFrames(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const frames = yield this.waitingSubIFramesLoaded(context);
            frames.forEach(frameWindow => {
                this.createIFrameRecorder(frameWindow);
            });
        });
    }
    recordIFrame(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const frameWindow = yield this.waitingIFrameLoaded(context);
            if (frameWindow) {
                this.createIFrameRecorder(frameWindow);
            }
        });
    }
    createIFrameRecorder(frameWindow) {
        const frameRecorder = new RecorderModule(Object.assign(Object.assign({}, this.options), { context: frameWindow, keep: true, rootRecorder: this.options.rootRecorder || this, rootContext: this.options.rootContext }));
        const frameElement = frameWindow.frameElement;
        frameElement.frameRecorder = frameRecorder;
        this.destroyStore.add(() => frameRecorder.destroy());
    }
    connectCompose(list) {
        return (data) => __awaiter(this, void 0, void 0, function* () {
            return yield list.reduce((next, fn) => {
                return this.createNext(fn, data, next);
            }, () => Promise.resolve())();
        });
    }
    createNext(fn, data, next) {
        return () => __awaiter(this, void 0, void 0, function* () { return yield fn(data, next); });
    }
}
RecorderModule.defaultRecordOpts = {
    mode: 'default',
    audio: false,
    video: false,
    emitLocationImmediate: true,
    context: window,
    rewriteResource: [],
    disableWatchers: []
};

export { Recorder, RecorderModule, RecorderStatus, Watcher };
//# sourceMappingURL=xreplay-recorder.esm.js.map

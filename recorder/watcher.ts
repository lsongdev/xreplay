import { EventEmitter } from "./events"

type Procedure = (...args: any[]) => void

type Options = {
  isImmediate?: boolean
  // not standard
  isTrailing?: boolean
}

export function debounce<F extends Procedure>(
  func: F,
  waitMilliseconds: number,
  options: Options = {
    isImmediate: false,
    isTrailing: false
  }
): (this: ThisParameterType<F>, ...args: Parameters<F>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    const context = this
    const doLater = function () {
      timeoutId = undefined
      if (!options.isImmediate || options.isTrailing) {
        func.apply(context, args)
      }
    }
    const shouldCallNow = options.isImmediate && timeoutId === undefined
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(doLater, waitMilliseconds)
    if (shouldCallNow) {
      func.apply(context, args)
    }
  }
}

export function throttle(func: Function, wait: number, options: { leading?: boolean; trailing?: boolean } = {}): any {
  let context: any
  let args: any
  let result: any
  let timeout: any = null
  let previous = 0

  const later = function () {
    previous = options.leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context, args)
    if (!timeout) context = args = null
  }
  return function (this: any) {
    const now = Date.now()
    if (!previous && options.leading === false) previous = now
    const remaining = wait - (now - previous)
    context = this
    args = arguments
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
      if (!timeout) context = args = null
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining)
    }
    return result
  }
}

export class Watcher extends EventEmitter {
  running = false
  start() {
    this.running = true;
  }
  stop() {
    this.running = false;
  }
  install(options: any) {
    throw new Error();
  }
  report(type: string, data: any) {
    if (!this.running) return;
    const timestamp = Date.now();
    return this.emit('record', { type, data, timestamp });
  }
  registerUninstall(fn: any) {
    return this.on('uninstall', fn);
  }
  uninstall() {
    const hooks = this.listeners['uninstall'];
    hooks.forEach((fn: any) => fn());
  }
  public registerEvent(options: {
    context: Window
    eventTypes: string[]
    handleFn: (...args: any[]) => void
    listenerOptions: AddEventListenerOptions
    type: 'throttle' | 'debounce'
    optimizeOptions?: { [key: string]: boolean }
    waitTime: number
  }) {
    const { context, eventTypes, handleFn, listenerOptions, type, optimizeOptions, waitTime } = options
    let listenerHandle: any;
    switch (type) {
      case 'debounce':
        listenerHandle = debounce;
        break;
      case 'throttle':
        listenerHandle = throttle;
        break;
    }
    eventTypes
      .map(type => (fn: (e: Event) => void) => {
        context.addEventListener(type, fn, listenerOptions)
      })
      .forEach(handle => handle(listenerHandle(handleFn, waitTime, optimizeOptions)))

    this.registerUninstall(() => {
      eventTypes.forEach(type => {
        context.removeEventListener(type, listenerHandle, listenerOptions)
      })
    })
  }
}
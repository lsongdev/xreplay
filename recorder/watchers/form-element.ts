
import { Watcher } from '../watcher'

enum eventTypes {
  'input' = 'input',
  'change' = 'change',
  'focus' = 'focus',
  'blur' = 'blur'
}

const createHijacking = (context: any, handleEvent: any) => {
  const eventListenerOptions = { once: false, passive: true, capture: true };
  function fn(this: Window, e: Event) {
    const eventType = e.type;
    handleEvent(e.target, eventType);
  };
  const arr: any[] = [];
  for (const type of Object.values(eventTypes)) {
    context.addEventListener(type, fn, eventListenerOptions);
    arr.push(() => context.removeEventListener(type, fn, eventListenerOptions));
  }
  const hijacking = (key: string, target: HTMLElement) => {
    const descriptor: any = Object.getOwnPropertyDescriptor(target, key);
    Object.defineProperty(target, key, {
      set(value: string | boolean) {
        setTimeout(() => handleEvent(this, key, value));
        if (descriptor && descriptor.set) {
          descriptor.set.call(this, value);
        }
      }
    });
    arr.push(() => Object.defineProperty(target, key, descriptor));
  }
  const bind = () => {
    new Map<HTMLElement, string>([
      [context.HTMLSelectElement.prototype, 'value'],
      [context.HTMLTextAreaElement.prototype, 'value'],
      [context.HTMLOptionElement.prototype, 'selected']
    ]).forEach((target, key) => hijacking(target, key));

    new Map<string, HTMLElement>([
      ['value', context.HTMLInputElement.prototype],
      ['checked', context.HTMLInputElement.prototype]
    ]).forEach((target, key) => hijacking(key, target));
  };
  return bind();
};

function hijackInputs(context: any) {
  const hijacking = createHijacking(context, (el: HTMLElement, key: string, value: any) => {
    console.log(el, key, value);
  });
}
export class FormElementWatcher extends Watcher {
  install({ context }: any) {
    hijackInputs(context);
  }
}

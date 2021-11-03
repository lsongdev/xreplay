

enum eventTypes {
  'input' = 'input',
  'change' = 'change',
  'focus' = 'focus',
  'blur' = 'blur'
}

type EventHandler = (el: HTMLInputElement, key: string, value: any) => void;

export const createFormMonitor = (context: any, handleEvent: EventHandler) => {
  const eventListenerOptions = { once: false, passive: true, capture: true };
  function fn(this: Window, e: Event) {
    const { type: eventType } = e;
    const target = e.target as HTMLInputElement;
    let key = '', value;
    switch (eventType) {
      case eventTypes.focus:
        key = 'focus';
        break;
      case eventTypes.blur:
        key = 'blur';
        break;
      case eventTypes.input:
      case eventTypes.change:
        key = 'value';
        const inputType = target.getAttribute('type') || 'text';
        if (inputType === 'checkbox' || inputType === 'radio') {
          if (eventType === 'input') return;
          key = 'checked';
        }
        value = (target as any)[key];
        break;
    }
    if(target.nodeType === Node.ELEMENT_NODE) {
      handleEvent(target, key, value);
    }
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
  return {
    bind,
    hijacking,
    unbind: () => arr.map(fn => fn())
  };
};

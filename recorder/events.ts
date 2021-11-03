export class EventEmitter {
  listeners: any = {}
  on(type: string, handler: any) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(handler);
    return this;
  }
  emit(type: string, data: any) {
    console.log(type, data);
    for (const fn of this.listeners[type] || []) {
      fn.call(this, data);
    }
  }
}
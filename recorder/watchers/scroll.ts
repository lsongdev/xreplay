import { Watcher } from '../watcher'

export class ScrollWatcher extends Watcher {
  install({ context }: any) {
    const { scrollingElement } = context.document;
    this.registerEvent({
      context,
      type: 'throttle',
      eventTypes: ['scroll'],
      listenerOptions: { capture: true },
      optimizeOptions: {},
      waitTime: 100,
      handleFn: (e) => {
        console.log('scroll', e);
      }
    })
  }
}

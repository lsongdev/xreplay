
import { Watcher } from '../watcher'

const getWindowSize = (context: any) => {
  const { innerWidth: width, innerHeight: height } = context;
  return { width, height }
};

export class WindowWatcher extends Watcher {
  install({ context }: any) {
    this.sendData(context);
    this.registerEvent({
      context,
      eventTypes: ['resize'],
      listenerOptions: { capture: true },
      type: 'throttle',
      optimizeOptions: { trailing: true },
      waitTime: 500,
      handleFn: () => this.sendData(context)
    })
  }
  sendData(context: any) {
    const size = getWindowSize(context);
    this.report('WINDOW', size);
  }
}

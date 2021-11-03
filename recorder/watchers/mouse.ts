
import { Watcher } from '../watcher'
import { finder } from '../finder';

// export const bindMove = (context: any, fn: any) => {
//   const handle = throttle((e: MouseEvent) => {
//     const { offsetX: x, offsetY: y } = e;
//     fn({ x, y });
//   }, 300, {
//     trailing: true,
//     leading: true
//   });
//   context.addEventListener('mousemove', handle);
// };

// export const bindClick = (context: any, fn: any) => {
//   context.addEventListener('click', (e: PointerEvent) => {
//     const { offsetX: x, offsetY: y, target } = e;
//     fn({ x, y, target });
//   });
// };

// export const createMouseMonitor = (context: any) => {
//   return {
//     bindMove: (fn: any) => bindMove(context, fn),
//     bindClick: (fn: any) => bindClick(context, fn),
//   };
// };

type OptionType = {
  context: Window,
};

export class MouseWatcher extends Watcher {
  install({ context }: OptionType) {
    this.registerEvent({
      context,
      eventTypes: ['mousemove'],
      type: 'throttle',
      waitTime: 300,
      listenerOptions: {},
      optimizeOptions: {
        trailing: true,
        leading: true
      },
      handleFn: (e: MouseEvent) => {
        const { offsetX: x, offsetY: y } = e;
        this.report('MOUSE', { type: 'MOVE', x, y });
      },
    });
    this.registerEvent({
      context,
      eventTypes: ['click'],
      type: 'throttle',
      waitTime: 300,
      listenerOptions: {},
      handleFn: (e) => {
        const { offsetX: x, offsetY: y, target } = e;
        const selector = finder(target);
        this.report('MOUSE', { type: 'CLICK', x, y, selector });
      }
    });
  }
}

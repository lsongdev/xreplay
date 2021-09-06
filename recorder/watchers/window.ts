
import { WindowRecord, RecordType } from '../../types'
import { Watcher } from '../watcher'

export class WindowWatcher extends Watcher<WindowRecord> {
    private width() {
        return this.context.innerWidth
    }

    private height() {
        return this.context.innerHeight
    }

    protected init() {
        this.emitData(...this.wrapData(null))
        this.registerEvent({
            context: this.context,
            eventTypes: ['resize'],
            handleFn: this.handleFn.bind(this),
            listenerOptions: { capture: true },
            type: 'throttle',
            optimizeOptions: { trailing: true },
            waitTime: 500
        })
    }

    private handleFn(e: Event) {
        const { type, target } = e
        let id: number | null = null

        if (target && target instanceof HTMLElement) {
            if (target.constructor.name === HTMLVideoElement.name) {
                return
            }
            id = this.getNodeId(target as Element | Document)
        }

        if (type === 'resize') {
            this.emitData(...this.wrapData(id))
        }
    }

    private wrapData(id: number | null): [RecordType.WINDOW, WindowRecord['data']] {
        return [
            RecordType.WINDOW,
            {
                id,
                width: this.width(),
                height: this.height()
            }
        ]
    }
}

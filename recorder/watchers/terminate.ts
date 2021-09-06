
import { TerminateRecord, RecordType } from '../../types'
import { Watcher } from '../watcher'

export class TerminateWatcher extends Watcher<TerminateRecord> {
    protected init() {
        this.context.addEventListener('beforeunload', this.handleFn)

        this.uninstall(() => {
            this.context.removeEventListener('beforeunload', this.handleFn)
        })
    }

    private handleFn() {
        // do some sync job
        // navigator.sendBeacon(url, data)
        // this.emitData(this.wrapData())
    }

    private wrapData() {
        return [RecordType.TERMINATE, null]
    }
}

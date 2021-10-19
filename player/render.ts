
import {
    RecordData,
    FormElementRecordData,
    RecordType,
    DOMRecordData,
    LocationRecordData,
    CanvasRecordData,
    SnapshotRecord,
    PreFetchRecordData,
    WebGLRecordData,
    CanvasSnapshotRecordData
} from '../types'
import { PlayerComponent } from './components/player'
import { delay } from '../utils'
import { renderFont } from './renders/font'
import { renderPatch } from './renders/patch'
import { renderLocation } from './renders/location'
import { renderSnapshot } from './renders/snapshot'
import { renderScroll } from './renders/scroll'
import { renderWindow } from './renders/window'
import { renderMouse } from './renders/mouse'
import { renderFormEl } from './renders/form-el'
import { renderDom } from './renders/dom'

export async function renderAll(
    this: PlayerComponent,
    recordData: RecordData,
    opts?: { speed: number; isJumping: boolean }
) {
    const { isJumping, speed } = opts || {}
    const delayTime = isJumping ? 0 : 200
    const { type, data } = recordData

    // waiting for mouse or scroll transform animation finish
    const actionDelay = () => (delayTime ? delay(delayTime) : Promise.resolve())

    switch (type) {
        case RecordType.SNAPSHOT: {
            renderSnapshot(data as SnapshotRecord['data'])
            break
        }

        case RecordType.SCROLL: {
            renderScroll.call(this, data)
            break
        }
        case RecordType.WINDOW: {
            renderWindow.call(this, data)
            break
        }
        case RecordType.MOUSE: {
            renderMouse.call(this, data)
            break
        }
        case RecordType.DOM: {
            if (!isJumping && speed === 1) {
                await actionDelay()
            }
            renderDom(data as DOMRecordData)
            break
        }
        case RecordType.FORM_EL: {
            if (!isJumping && speed === 1) {
                await actionDelay()
            }
            renderFormEl(data as FormElementRecordData, { isJumping })
            break
        }
        case RecordType.LOCATION: {
            renderLocation(data as LocationRecordData)
            break
        }
        case RecordType.FONT: {
            renderFont.call(this, data as CanvasRecordData)
            break
        }
        case RecordType.PATCH: {
            renderPatch(data as PreFetchRecordData)
            break
        }
        default: {
            break
        }
    }
}

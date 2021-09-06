
import { VideoRecordData } from '../../types'
import { nodeStore } from '../../utils'

import { PlayerComponent } from '../components/player'

export function renderVideo(this: PlayerComponent, data: VideoRecordData) {
    const { id, blobUrl } = data

    if (!blobUrl) {
        return
    }

    const targetNode = nodeStore.getNode(id)
    const targetVideo = targetNode as HTMLVideoElement

    if (!targetVideo) {
        return
    }

    targetVideo.autoplay = targetVideo.muted = true
    targetVideo.loop = targetVideo.controls = false
    targetVideo.src = blobUrl
}

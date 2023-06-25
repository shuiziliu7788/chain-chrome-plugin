import type {PlasmoMessaging} from "@plasmohq/messaging"

export interface Download {
    name: string,
    type?: string,
    body: string
}

const handler: PlasmoMessaging.MessageHandler<Download, boolean> = async (req, res) => {
    const {name, type, body} = req.body
    try {
        await chrome.downloads.download({
            filename: name,
            url: `data:text/${type ?? "text"},` + encodeURIComponent(body),
            conflictAction: "prompt"
        })
        res.send(true)
    } catch (e) {
        res.send(false)
    }
}

export default handler
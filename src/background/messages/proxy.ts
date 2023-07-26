import type {PlasmoMessaging} from "@plasmohq/messaging"

export type METHOD = "POST" | "GET" | "DELETE"

export type Request = {
    host: string,
    method?: METHOD
    header?: [string, string][] | Record<string, string> | Headers
    data?: any,
    params?: Record<string, any>
}

export type Response<T> = {
    error?: string
    data?: T
}
const handler: PlasmoMessaging.MessageHandler<Request, Response<any>> = async (req, res) => {
    try {
        // 处理URL
        if (req.body.params) {
            const params = Object.keys(req.body.params)
                .filter(k => !(req.body.params[k] === null || req.body.params[k] === undefined))
                .map(k => k + "=" + req.body.params[k])
                .join("&");
            if (req.body.host.includes("?")) {
                req.body.host = req.body.host + "&" + params
            } else {
                req.body.host = req.body.host + "?" + params
            }
        }

        const response = await fetch(req.body.host, {
            keepalive: true,
            method: req.body.method,
            body: req.body.data,
            headers: req.body.header
        });
        res.send({
            data: await response.json(),
        })
    } catch (e) {
        res.send({
            error: e.toString()
        })
    }
}

export default handler
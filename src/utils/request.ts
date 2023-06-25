import {sendToBackground} from "@plasmohq/messaging";
import type { Request, Response} from "@/background/messages/proxy";


const request = function <T>(request:Request): Promise<T> {
    return new Promise(async (resolve, reject) => {
        try {
            if (typeof request.data == "object") {
                request.data = JSON.stringify(request.data)
            }
            const resp = await sendToBackground<Request, Response<T>>({
                name: "proxy",
                body: request,
            })
            if (resp.error) {
                reject(resp.error)
            } else {
                // @ts-ignore
                resolve(resp.data)
            }
        } catch (e) {
            reject(e.toString())
        }
    })
}

export default request
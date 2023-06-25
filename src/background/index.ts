import "@plasmohq/messaging/background"
import {Storage} from "@plasmohq/storage";
import config from "./config.json"

const storage = new Storage()

const install = () => {
    Object.keys(config).map(async (key) => {
        const cfg = await storage.get<any>(key)
        if (cfg) {
            return
        }
        await storage.set(key, config[key])
        console.log(`导入${key}配置成功`)
    })
}

install()
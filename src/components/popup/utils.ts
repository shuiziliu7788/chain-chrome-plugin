import {Storage} from "@plasmohq/storage";

export const storage = new Storage()

export const getCurrentTabHost = async (): Promise<string | undefined> => {
    const tabs = await chrome.tabs.query({lastFocusedWindow: true, active: true})
    if (tabs.length == 0 || !/^http/.test(tabs[tabs.length - 1].url)) {
        return undefined
    }
    return tabs[tabs.length - 1].url.match(/\/\/([\w.]+)\//)[1]
}

export const getAllConfig = async () => {
    const cfg = await storage.getAll()
    Object.keys(cfg).forEach((key) => {
        cfg[key] = JSON.parse(cfg[key])
    })
    return cfg
}

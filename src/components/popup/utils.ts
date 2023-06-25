import {Storage} from "@plasmohq/storage";
import {checkAddress, Dict, Method, unique} from "@/components";
import {generate} from "@/utils/function";

export const storage = new Storage()

export const getCurrentTabHost = async (): Promise<string> => {
    const tabs = await chrome.tabs.query({lastFocusedWindow: true, active: true})
    if (tabs.length == 0 || !/^http/.test(tabs[tabs.length - 1].url)) {
        return ""
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

const parsingDict = (n, o): Dict[] => {
    const dict: Dict[] = []
    if (Array.isArray(n)) {
        dict.push(...n.map((v): Dict => {
            let value = ""
            let label = ""
            let type
            if (typeof v == 'object') {
                label = v.label
                type = v.type
            } else if (typeof v == 'string') {
                label = v
            }
            const func = generate(label);
            value = func.signature_hash
            return {value, label, type}
        }))
    }
    if (Array.isArray(o)) {
        dict.push(...o)
    }
    return unique<Dict>(dict, 'value')
}

const parsingMethods = (n, o): Method[] => {
    const methods: Method[] = []
    if (Array.isArray(n)) {
        methods.push(...n.map((v): Method => {
            let value = ""
            if (typeof v == 'object') {
                value = v.value
            } else if (typeof v == 'string') {
                value = v
            }
            const fragment = generate(value)
            let signature_text = fragment.signature_text
            if (fragment.outputs && fragment.outputs.length > 0) {
                signature_text = signature_text + ` returns (${fragment.outputs.map(item => item.type + " " + item.name ?? "").join(",")})`
            }
            return {
                id: fragment.signature_hash,
                label: fragment.signature_text,
                value: signature_text
            }
        }))
    }

    if (Array.isArray(o)) {
        methods.push(...o)
    }

    return unique<Method>(methods, 'id')
}

const parsingTenderly = (n, o): any => {
    let cfg = {}
    if (typeof n == 'object') {
        cfg = {
            ...cfg,
            ...n
        }
    }
    if (typeof o == 'object') {
        cfg = {
            ...cfg,
            ...o
        }
    }
    return cfg
}

const parsingExplorer = (n, o): any => {
    let cfg: any = {}
    if (typeof n == 'object') {

        if (Array.isArray(n.router)) {
            n.router = n.router.map(r => {
                r.address = checkAddress(r.address)
                return r
            })
        }

        if (Array.isArray(n.tokens)) {
            n.tokens = n.tokens.map(t => {
                t.address = checkAddress(t.address)
                return t
            })
        }

        cfg = {
            ...cfg,
            ...n
        }
    }

    if (typeof o == 'object') {
        let router = Array.isArray(cfg.router) ? cfg.router : []
        let tokens = Array.isArray(cfg.tokens) ? cfg.tokens : []
        if (Array.isArray(o.router)) {
            router.push(...o.router.map(t => {
                t.address = checkAddress(t.address)
                return t
            }))
        }

        if (Array.isArray(o.tokens)) {
            tokens.push(...o.tokens.map(t => {
                t.address = checkAddress(t.address)
                return t
            }))
        }

        cfg = {
            ...cfg,
            ...o,
            router: unique(router, "address"),
            tokens: unique(tokens, "address"),
        }
    }

    return cfg
}

// 格式化配置文件
export const formatted = (newCfg: any, oldCfg): any => {
    Object.keys(newCfg).forEach((key) => {
        const sub = newCfg[key]
        if (key == 'dict') {
            newCfg[key] = parsingDict(sub, oldCfg[key])
        } else if (key == 'methods') {
            newCfg[key] = parsingMethods(sub, oldCfg[key])
        } else if (key == 'tenderly') {
            newCfg[key] = parsingTenderly(sub, oldCfg[key])
        } else if (key == 'decompile_network') {
            newCfg[key] = oldCfg[key] ? oldCfg[key] : sub
        } else {
            newCfg[key] = parsingExplorer(sub, oldCfg[key])
        }
    })
    return newCfg
}

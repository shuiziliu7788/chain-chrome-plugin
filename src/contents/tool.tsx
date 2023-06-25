import type {PlasmoCSConfig, PlasmoGetShadowHostId, PlasmoGetStyle, PlasmoRender} from "plasmo"
import styleText from "data-text:./tool.less"
import React from "react";
import {Storage} from "@plasmohq/storage";
import {createRoot} from "react-dom/client";
import {Explorer, Layout, ToolDrawer} from "@/components";

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    exclude_matches: ['https://remix.ethereum.org/*'],
    css: ["../style/index.less"]
}

export const getShadowHostId: PlasmoGetShadowHostId = () => `tool`

export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement("style")
    style.textContent = styleText
    return style
}

export const render: PlasmoRender<any> = async ({anchor, createRootContainer}: any) => {
    try {
        const explorer = await (new Storage()).get<Explorer>(location.host)
        if (!explorer || !explorer.enable) {
            return
        }
        const rootContainer = await createRootContainer(anchor)
        const root = createRoot(rootContainer)
        root.render(<Layout
            popupContainer={document.getElementById('tool').shadowRoot}
            styleContainer={document.getElementById('tool').shadowRoot}
        >
            <ToolDrawer/>
        </Layout>)
    } catch (e) {
        console.error(e)
    }
}
import ReactDOM from "react-dom/client";
import {Avatar, Typography} from "antd";
import {CheckOutlined, SnippetsOutlined} from "@ant-design/icons";
import Amount from "./amount";

const {Paragraph} = Typography

let decimals = 18

interface Node {
    element: Element,
    name: string,
    value: string,
    type: string
}

export const injectClipboard = ({element, value, type}: Node) => {
    const rootContainer = document.createElement("span")
    element.appendChild(rootContainer)
    const root = ReactDOM.createRoot(rootContainer);
    root.render(<Paragraph
        className={'clipboard'}
        copyable={{
            tooltips: ['复制', '复制成功'],
            text: value,
            icon: [
                <Avatar size={18} icon={<SnippetsOutlined/>}/>,
                <Avatar size={18} icon={<CheckOutlined/>}/>,
            ]
        }}/>)

    if (type !== 'uint256') {
        return;
    }
    const pluginDom = document.createElement("div")
    element.appendChild(pluginDom)
    const pluginRoot = ReactDOM.createRoot(pluginDom);

    pluginRoot.render(<Amount
        decimals={decimals}
        value={value}
        type={type}
    />)
}


export const InjectReadPage = () => {

    const cards = document.querySelectorAll("div.card");
    const elements: Node[] = []

    cards.forEach((value, key, parent) => {
        try {
            if (value.querySelectorAll('div.form-group').length > 1 || value.children.length !== 2) {
                return
            }
            const el = value.children[1].querySelector("div.form-group")
            const names = value.children[0].textContent.trim().split(/\s+/);
            const val = el.textContent.trim().split(/\s+/);
            const name = names[names.length - 1].trim()
            const v = val.slice(0, -1).join(" ").trim()
            const type = val[val.length - 1].trim()
            if (name == 'decimals') {
                decimals = Number(v)
            }
            elements.push({
                element: el,
                name: name,
                value: v,
                type: type,
            })
        } catch (e) {

        }
    })


    elements.forEach((value) => {
        injectClipboard(value)
    })
}


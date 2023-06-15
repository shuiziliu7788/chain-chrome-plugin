import {App, ConfigProvider, theme} from "antd";
import React from "react";
import {StyleProvider,} from "antd-style";

interface LayoutProps {
    popupContainer?: HTMLElement | ShadowRoot | any
    styleContainer?: HTMLElement | ShadowRoot | any
    children?: React.ReactNode;
}


export const Layout = (props: LayoutProps) => {
    return <ConfigProvider
        theme={{
            token: {
                borderRadius: 0,
                zIndexBase: 2000,
                zIndexPopupBase: 2000,
            },
            algorithm: theme.darkAlgorithm,
        }}
        getPopupContainer={() => props.popupContainer}
    >
        <StyleProvider
            container={props.styleContainer}
        >
            <App>
                {props.children}
            </App>
        </StyleProvider>
    </ConfigProvider>
}


export default Layout
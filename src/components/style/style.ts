import {createStyles} from "antd-style"

export const useTabFlex = createStyles(() => ({
    container: {
        position: 'fixed',
        right: '50%',
        width: 'auto',
        transform: 'translate(50%,0%)',
        bottom: '200px',
    },
    flex: {
        height: "100%",
        ".ant-tabs-nav": {
            marginBottom: "0 !important",
            ".ant-tabs-nav-wrap": {
                ".ant-tabs-nav-list": {
                    width: "100%",
                    ".ant-tabs-tab": {
                        userSelect: "none",
                        flex: 1,
                        marginLeft: "0",
                        ".ant-tabs-tab-btn": {width: "100%", textAlign: "center"}
                    },
                    ".ant-tabs-ink-bar": {display: "none !important"}
                }
            },
            ".ant-tabs-nav-operations": {display: "none !important"}
        },
        ".ant-tabs-content-holder": {
            height: "100%",
            ".ant-tabs-content-top": {height: "100%"},
            ".ant-tabs-tabpane": {height: "100%"}
        }
    },
}))
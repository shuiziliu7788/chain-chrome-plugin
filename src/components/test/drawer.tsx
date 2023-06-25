import React, {useEffect, useState} from "react";
import {Button, Drawer, Space, Tabs, Tooltip} from "antd";
import {ExplorerProvider, Python, Solidity} from "@/components";
import useHooks from "@/components/provider/hooks";
import Call from "./call";
import Tender from "./tender";
import Calculator from "./calculator";
import {BugOutlined} from "@ant-design/icons";
import {useTabFlex} from "@/components/style";
import ABI from "./abi";

export const ToolDrawer = () => {
    const hook = useHooks();
    const [open, setOpen] = useState(false);
    const [activeKey, setActiveKey] = useState<string>('call');
    const {styles} = useTabFlex();

    useEffect(() => {
        document.body.addEventListener("click", (e) => {
            if (e.x < 200) {
                setOpen(false)
            }
        })
    }, [])

    return <ExplorerProvider
        {...hook}
    >
        <div
            className={styles.container}
        >
            <Space>
                <Solidity/>
                <Tooltip title={'工具'}>
                    <Button
                        type={'primary'}
                        shape={'circle'}
                        icon={<BugOutlined/>}
                        onClick={() => {
                            setOpen(!open)
                        }}
                    />
                </Tooltip>
                <Python/>
            </Space>
        </div>

        <Drawer
            width={538}
            closable={false}
            bodyStyle={{padding: 0}}
            mask={false}
            open={open}
            onClose={() => {
                setOpen(false)
            }}>
            <Tabs
                className={styles.flex}
                activeKey={activeKey}
                tabPosition={'top'}
                type={'card'}
                tabBarGutter={0}
                items={[
                    {
                        label: "模拟",
                        key: "call",
                        children: <Call rpc={hook.explorer.rpc}/>
                    },
                    {
                        label: "调试",
                        key: "test",
                        children: <Tender/>,
                    },
                    {
                        label: "工具",
                        key: "tool",
                        children: <Calculator/>,
                    },
                    {
                        label: "签名",
                        key: "abi",
                        children: <ABI/>
                    },
                ]}
                onChange={(e) => {
                    setActiveKey(e)
                }}
            />
        </Drawer>
    </ExplorerProvider>
}
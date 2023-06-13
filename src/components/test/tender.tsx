import Node from "./node";
import React, {useState} from "react";
import {Tabs} from "antd";
import Send from "@/components/test/send";
import {useTabFlex} from "@/components/style";
import Call from "./call";
import {ConsumerProps, ExplorerContext} from "@/components";
import Swap from "@/components/test/swap";

export const Tender = () => {
    const {current_fork} = React.useContext<ConsumerProps>(ExplorerContext);
    const [activeKey, setActiveKey] = useState<string>('send');
    const {styles} = useTabFlex();

    return <div id={'test'} style={{height: '100%'}}>
        <Node/>
        <Tabs
            className={styles.flex}
            style={{height: 'calc(100% - 35px)'}}
            activeKey={activeKey}
            tabPosition={'top'}
            type={'card'}
            size={'small'}
            tabBarGutter={0}
            items={[
                {
                    label: "模拟",
                    key: "call",
                    children: <Call rpc={current_fork ? current_fork.json_rpc_url : undefined}/>
                },
                {
                    label: "调试",
                    key: "send",
                    children: <Send/>
                },
                {
                    label: "交易",
                    key: "swap",
                    children: <Swap/>
                },
            ]}
            onChange={(e) => {
                setActiveKey(e)
            }}
        />
    </div>
}

export default Tender
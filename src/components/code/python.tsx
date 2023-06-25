import {App, Button, Tooltip} from "antd";
import {ExclamationCircleOutlined, RetweetOutlined} from "@ant-design/icons";
import React, {useState} from "react";
import {ConsumerProps, ExplorerContext} from "../provider";
import request from "@/utils/request";
import {sendToBackground} from "@plasmohq/messaging";
import type {Download} from "@/background/messages/download";


export const Python = () => {
    const {message} = App.useApp()
    const {contract, decompile_network, explorer} = React.useContext<ConsumerProps>(ExplorerContext);
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(undefined)

    const compile = async () => {
        for (let i = 0; i < 50; i++) {
            const resp = await request<any>({
                host: decompile_network,
                params: {
                    address: contract.address,
                    node: explorer.rpc,
                    rpc: explorer.rpc,
                },
            })
            if (resp.status) {
                return resp.code
            }
        }
        throw new Error("反编译超时,请重设！")
    }

    const load = async () => {
        try {
            setLoading(true)
            const code = await compile()
            await sendToBackground<Download, boolean>({
                name: "download",
                body: {
                    name: `${contract.address}.py`,
                    body: code,
                    type: ".py",
                }
            })
            setError(undefined)
        } catch (e: any) {
            setError(e.toString())
            message.error(e.toString())
        } finally {
            setLoading(false)
        }
    }

    return <Tooltip title={error ?? "下载反编译代码"}>
        <Button
            type={'primary'}
            shape={'circle'}
            loading={loading}
            icon={error ? <ExclamationCircleOutlined style={{color: '#ff4d4f'}}/> : <RetweetOutlined/>}
            onClick={load}
        />
    </Tooltip>
}
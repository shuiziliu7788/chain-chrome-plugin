import React, {useState} from "react";
import {App, Button, Tooltip} from "antd";
import {ArrowDownOutlined, ExclamationCircleOutlined} from "@ant-design/icons";
import {ConsumerProps, ExplorerContext} from "../provider";
import {sendToBackground} from "@plasmohq/messaging";
import request from "@/utils/request";
import type {Download} from "@/background/messages/download";

const escape2Html = (str: string): string => {
    const arrEntities = {'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"'};
    return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, function (all, t) {
        return arrEntities[t];
    });
}

export const Solidity = () => {
    const {message} = App.useApp()
    const {contract, explorer} = React.useContext<ConsumerProps>(ExplorerContext);
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    const source = async () => {
        let sourceCode = ""
        let host = `https://api.${location.host}/api`
        if (location.host == 'scan.pego.network') {
            host = `https:/${location.host}/api`
        }

        const resp = await request<any>({
            host,
            method: 'GET',
            params: {
                module: "contract",
                action: "getsourcecode",
                address: contract.address,
                apikey: explorer.secret_key,
            }
        })

        if (!Array.isArray(resp.result) || resp.result.length === 0) {
            throw new Error(resp.result ?? "下载失败")
        }

        sourceCode = resp.result[0]['SourceCode'];

        if (sourceCode && /^{{1,2}/.test(sourceCode)) {
            let sources
            if (/^{{2}/.test(sourceCode)) {
                sourceCode = sourceCode.slice(1, sourceCode.length - 1)
                const parse = JSON.parse(sourceCode);
                sources = parse["sources"];
            } else {
                sources = JSON.parse(sourceCode);
            }
            sourceCode = ""
            const keys = Object.keys(sources)
            for (let i = (keys.length - 1); i >= 0; i--) {
                sourceCode += sources[keys[i]]['content']
            }
        }

        return escape2Html(sourceCode);
    }

    const coreDao = async () => {
        const resp = await request<any>({
            host: "https://scan.coredao.org/api/chain/abi",
            method: 'POST',
            data: {
                contractAddress: contract.address
            }
        })
        if (resp.code !== "00000") {
            throw new Error("获取源码失败")
        }
        const response = await fetch("https://scan.coredao.org" + resp.data.source[0].path)
        if (response.status !== 200) {
            throw new Error("获取源码失败")
        }
        return response.text()
    }

    const load = async () => {
        try {
            setLoading(true)
            let sourceCode = ""
            if ("scan.coredao.org" == location.host) {
                sourceCode = await coreDao()
            } else {
                sourceCode = await source()
            }

            if (contract.symbol != "") {
                sourceCode = `
${sourceCode}
/*
${contract.symbol}
${contract.address}
*/
                `
            }
            // 下载处理下载文件
            await sendToBackground<Download, boolean>({
                name: "download",
                body: {
                    name: `${contract.address}.sol`,
                    body: sourceCode,
                    type: ".sol",
                }
            })
            setError(undefined)
        } catch (e) {
            message.error(e.toString())
            setError(e.toString())
        } finally {
            setLoading(false)
        }
    }

    return <Tooltip title={error ?? '下载开源代码'}>
        <Button
            type={'primary'}
            shape={'circle'}
            loading={loading}
            icon={error ? <ExclamationCircleOutlined
                style={{color: '#ff4d4f'}}/> : <ArrowDownOutlined/>}
            onClick={load}
        />
    </Tooltip>
}
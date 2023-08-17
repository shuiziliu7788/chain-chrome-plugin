import React, {useState} from "react";
import {App, Button, Tooltip} from "antd";
import {ArrowDownOutlined, ExclamationCircleOutlined} from "@ant-design/icons";
import {ConsumerProps, ExplorerContext} from "../provider";
import {sendToBackground} from "@plasmohq/messaging";
import request from "@/utils/request";
import type {Download} from "@/background/messages/download";
import type {Source} from "./typing";

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

    const getOpBNBSource = async (): Promise<Source> => {
        const resp = await request<any>({
            host: "https://op-bnb-mainnet-explorer-api.nodereal.io/api/contract/preverify",
            method: 'POST',
            data: {
                address: contract.address,
            },
            header: {
                "Content-Type": "application/json",
            }
        })

        const source: Source = {
            open: false,
            code: '',
            tag: []
        }
        if (!resp || resp.code != 0) {
            throw new Error("获取失败")
        }
        // data input_json
        if (!resp.data || !resp.data.input_json) {
            source.tag.push('未开源')
            return source
        }
        source.open = true;
        source.code = "";
        source.abi = resp.data.ouput_json.abi;
        const keys = Object.keys(resp.data.input_json.sources)
        for (let i = (keys.length - 1); i >= 0; i--) {
            source.code += resp.data.input_json.sources[keys[i]]['content'] + "\n\n"
        }
        source.code = escape2Html(source.code)
        return source
    }

    const getStandardSource = async (): Promise<Source> => {
        const host = explorer.developer_host ?? `https://api.${location.host}/api`
        const resp = await request<any>({
            host,
            method: 'GET',
            params: {
                module: "contract",
                action: "getsourcecode",
                address: contract.address,
                apikey: explorer.secret_key ?? "",
            }
        })
        const result = resp.result[0];
        const source: Source = {
            open: false,
            code: '',
            tag: []
        }

        if (result.Proxy != "0") {
            source.tag.push('代理合约')
            source.implementation = result.Implementation
        }

        if (result.SourceCode == "") {
            source.tag.push('未开源')
            return source
        }

        source.open = true;
        source.code = result.SourceCode;
        source.abi = result.ABI;

        if (source.code && /^{{1,2}/.test(source.code)) {
            let sources
            if (/^{{2}/.test(source.code)) {
                source.code = source.code.slice(1, source.code.length - 1)
                sources = JSON.parse(source.code)["sources"];
            } else {
                sources = JSON.parse(source.code);
            }
            source.code = ""

            const keys = Object.keys(sources)
            for (let i = (keys.length - 1); i >= 0; i--) {
                source.code += sources[keys[i]]['content'] + "\n\n"
            }
        }

        source.code = escape2Html(source.code)
        return source;
    }

    const getSource = async (): Promise<Source> => {
        if (location.host == "mainnet.opbnbscan.com") {
            return getOpBNBSource()
        }
        return getStandardSource()
    }

    const load = async () => {
        try {
            setLoading(true)
            let source: Source
            source = await getSource()

            if (contract.token) {
                source.code += `
/*
${contract.token.symbol}
${contract.address}${source.tag.length > 0 ? `(${source.tag.join(",")})` : ''}${source.implementation ? `\n${source.implementation}(真实合约)` : ''}
池子 ${contract.pools && contract.pools.length > 0 ? `${contract.pools.map(t => t.symbol).join(" ")}` : ''}

管理员：${contract.owner ?? ''}
GAS评估：
*/`
            }

            if (!source.code) {
                return message.error("未开源")
            }

            // 下载处理下载文件
            await sendToBackground<Download, boolean>({
                name: "download",
                body: {
                    name: `${contract.address}.sol`,
                    body: source.code,
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
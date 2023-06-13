import {App, Button, Col, Form, Input, Row, Upload} from "antd";
import {Storage} from "@plasmohq/storage";
import {useEffect, useState} from "react";
import {sendToBackground} from "@plasmohq/messaging";
import type {Download} from "@/background/messages/download";
import type {RcFile} from "antd/es/upload/interface";
import type {Explorer} from "@/components";
import {getAllConfig, getCurrentTabHost, storage} from "./utils";
import {useStyle} from "./style";


const key = "popup_page"

export const PageForm = () => {
    const [network, setNetwork] = useState<Explorer>();
    const [host, setHost] = useState<string>("")
    const {message} = App.useApp();
    const [form] = Form.useForm()
    const {styles} = useStyle();
    const onFinish = async (cfg: Explorer) => {
        message.loading({content: "正在保存", key, duration: 0})
        try {
            if (!/[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/.test(host)) {
                message.error({content: "当前域名不支持开启", key})
                return
            }
            cfg.enable = true
            cfg.router = network ? network.router : []
            cfg.tokens = network ? network.tokens : []
            await storage.set(host, cfg)
            if (!network) {
                await chrome.tabs.reload()
            }
            setNetwork(cfg)
            message.success({content: "保存成功", key})
        } catch (e) {
            message.error({content: "保存错误", key})
        }
    }

    const onUnload = async () => {
        message.loading({content: "正在移除注入", key, duration: 0})
        try {
            await storage.remove(host)
            form.resetFields()
            await chrome.tabs.reload()
            message.success({content: "移除成功", key, duration: 3})
        } catch (e) {
            message.error({content: "移除错误", key, duration: 3})
        }
    }

    const Export = async () => {
        try {
            const cfg = await getAllConfig()
            const json = JSON.stringify(cfg, null, 2);
            await sendToBackground<Download, boolean>({
                name: "download",
                body: {
                    name: `config.json`,
                    body: json,
                    type: ".json",
                }
            })
        } catch (e) {
            message.error(e.toString())
        }
    }

    const onUpload = async (file: RcFile) => {
        message.loading({content: "正在解析配置", key, duration: 0})
        try {
            if (file.type != 'application/json') {
                message.error({content: "配置文件格式错误", key})
                return
            }
            const parse = JSON.parse(await file.text());
            const storage = new Storage()
            await storage.removeAll()
            const keys = Object.keys(parse);
            for (let i = 0; i < keys.length; i++) {
                await storage.set(keys[i], parse[keys[i]])
            }
            message.success({content: "导入成功", key, duration: 3})
        } catch (e) {
            message.error({content: e.toString(), key})
        }
    }

    const onLoad = async () => {
        const host = await getCurrentTabHost()
        const explorer = await storage.get<Explorer>(host)
        if (explorer) {
            form.setFieldsValue(explorer)
            setNetwork(explorer)
        }
        setHost(host)
    }

    useEffect(() => {
        onLoad().catch(e => {
            console.error(e)
        })
    }, [])

    useEffect(() => {
        if (host == "") {
            return
        }
        const watch = {}
        watch[host] = (cfg: chrome.storage.StorageChange) => {
            setNetwork(cfg.newValue)
        }
        storage.watch(watch)
        return () => {
            storage.unwatchAll()
        }
    }, [host])

    return <Form
        form={form}
        layout={'vertical'}
        onFinish={onFinish}
        style={{padding: 16}}
    >
        <Form.Item required label={`当前浏览器`}>
            <Input
                disabled
                allowClear
                value={host}
            />
        </Form.Item>
        <Form.Item
            rules={[{required: true, whitespace: true, message: '请输入节点网络'}]}
            name={'rpc'}
            label={`节点网络`}>
            <Input
                allowClear
                placeholder="请输入RPC"
            />
        </Form.Item>

        <Form.Item
            name={'secret_key'}
            label={`开发者秘钥`}>
            <Input
                allowClear
                placeholder="请输入开发者秘钥，可以为空"
            />
        </Form.Item>

        <Form.Item>
            <Row gutter={[16, 16]}>
                {
                    network ? <>
                        <Col span={12}>
                            <Button
                                block
                                type={'primary'}
                                htmlType={'submit'}
                            >
                                保存配置
                            </Button>
                        </Col>
                        <Col span={12}>
                            <Button
                                block
                                danger
                                type={'primary'}
                                onClick={onUnload}
                            >
                                关闭插件
                            </Button>
                        </Col>
                    </> : <Col span={24}>
                        <Button
                            block
                            type={'primary'}
                            htmlType={'submit'}
                        >
                            开启插件
                        </Button>
                    </Col>
                }
                <Col span={12}>
                    <Button
                        block
                        type={'primary'}
                        onClick={Export}
                    >
                        导出配置
                    </Button>
                </Col>
                <Col span={12}>
                    <Upload
                        showUploadList={false}
                        accept={'.json'}
                        className={styles.upload}
                        beforeUpload={onUpload}
                    >
                        <Button block type={'primary'}>
                            导入配置
                        </Button>
                    </Upload>
                </Col>
            </Row>
        </Form.Item>
    </Form>
}
import {Card, Form, Input} from "antd";
import {decode, ParamType} from "@/utils/function";
import React, {useState} from "react";
import Outputs from "@/components/test/function/outputs";




const analyze = (code: string): ParamType[] => {
    if (typeof code !== 'string' || code === '') {
        return
    }
    // 我们
    code = code.replace(/^0x/g, "")
    if (code.length % 64 !== 0 && code.length % 64 !== 8) {
        throw new Error("输入错误")
    }
    let params: ParamType[] = []
    // 方法ID
    if (code.length % 64 == 8) {
        params.push({
            baseType: "bytes32",
            type: "bytes32",
            value: "0x" + code.slice(0, 8),
            fixed: true,
            name: "ID",
        })
        code = code.slice(8, code.length)
    }

    if (code.length > 0) {
        params = [...params, ...decode("0x" + code)]
    }

    return params;
}

export const Decode = () => {
    const [params, setParams] = useState<ParamType[]>([])
    const [error, setError] = useState<string>()

    const onChange = (code: string) => {
        setParams([])
        setError(undefined)
        try {
            const paramTypes = analyze(code);
            setParams(paramTypes ?? [])
        } catch (e) {
            setError(e?.toString() ?? "解析错误")
        }
    }

    return <>
        <Card
            className={'tool-card'}
        >
            <Form>
                <Form.Item>
                    <Input.TextArea
                        placeholder={'请输入合约参数'}
                        allowClear
                        autoSize={{
                            minRows: 1,
                            maxRows: 5,
                        }}
                        onChange={(e) => {
                            onChange(e.target.value)
                        }}
                    />
                </Form.Item>
                <Form.Item>
                    <Outputs
                        error={error}
                        outputs={params}
                    />
                </Form.Item>
            </Form>
        </Card>
    </>
}

export default Decode
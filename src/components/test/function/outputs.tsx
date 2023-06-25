import type {ParamType} from "@/utils/function";
import {Form, Input} from "antd";
import HashValue from "@/components/value";
import React from "react";

interface OutputsProps {
    error?: string
    outputs: ParamType[]
}

const Outputs = ({error, outputs}: OutputsProps) => {

    if (error) {
        return <Form.Item validateStatus={'error'}>
            <Input disabled style={{color: '#dc4446'}} value={error}/>
        </Form.Item>
    }

    return <>
        {
            outputs.map((value, index) => <HashValue index={index} key={index} value={value}/>)
        }
    </>
}

export default Outputs
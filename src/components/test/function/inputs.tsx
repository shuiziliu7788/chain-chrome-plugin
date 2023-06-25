import {Form} from "antd";
import Param from "@/components/test/function/param";
import React from "react";

interface InputsProps {
    type: string
}

const Inputs = ({type}: InputsProps) => {

    if (type == 'call') {
        return <Form.List name={'inputs'}>
            {
                (fields, operation) => {
                    operation.remove
                    return fields.map(({key, name}) => {
                        return <Form.Item
                            key={key}
                            name={name}
                        >
                            <Param
                                add={() => {
                                    operation.add({
                                        type: "address",
                                        baseType: 'address',
                                        value: "",
                                        fixed: false
                                    }, name + 1)
                                }}
                                remove={() => {
                                    operation.remove(name)
                                }}
                            />
                        </Form.Item>
                    })
                }
            }
        </Form.List>
    }

    return <Form.List name={'keys'}>
        {
            (fields, operation) => {
                operation.remove
                return fields.map(({key, name}) => {
                    return <Form.Item
                        key={key}
                        name={name}
                    >
                        <Param
                            type={type}
                            add={() => {
                                operation.add({
                                    type: "map",
                                    baseType: 'map',
                                    value: "",
                                    fixed: false
                                }, name + 1)
                            }}
                            remove={() => {
                                operation.remove(name)
                            }}
                        />
                    </Form.Item>
                })
            }
        }
    </Form.List>
}

export default Inputs
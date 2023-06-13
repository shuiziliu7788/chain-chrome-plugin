import {App, Input, InputRef, Space, Tag, theme} from "antd";
import {CSSProperties, useEffect, useRef, useState} from "react";
import {PlusOutlined} from "@ant-design/icons";
import {generate} from "@/utils/function";
import type {Method} from "@/components";


interface TagsProps {
    onChange?: (v: Method[]) => void
    value?: Method[]
}

const Tags = ({value, onChange}: TagsProps) => {
    const {message} = App.useApp()
    const {token} = theme.useToken();
    const [inputVisible, setInputVisible] = useState(false);
    const inputRef = useRef<InputRef>(null);
    const [inputValue, setInputValue] = useState('');

    const tagInputStyle: CSSProperties = {
        width: 78,
        verticalAlign: 'top',
    };

    const tagPlusStyle: CSSProperties = {
        background: token.colorBgContainer,
        borderStyle: 'dashed',
        cursor: 'pointer'
    };

    useEffect(() => {
        if (inputVisible) {
            inputRef.current?.focus();
        }
    }, [inputVisible]);

    const handleInputConfirm = async () => {
        try {
            if (inputValue == "") {
                return
            }
            const fragment = generate(inputValue)
            if (value && value.map(item => item.id).includes(fragment.signature_hash)) {
                return message.error("方法已存在")
            }
            let signature_text = fragment.signature_text
            if (fragment.outputs && fragment.outputs.length > 0) {
                signature_text = signature_text + ` returns (${fragment.outputs.map(item => item.type + " " + item.name ?? "").join(",")})`
            }
            onChange && onChange([
                ...(value ?? []),
                {
                    id: fragment.signature_hash,
                    label: fragment.signature_text,
                    value: signature_text
                }
            ])

        } catch (e) {
            message.error("保存错误")
        } finally {
            setInputVisible(false);
            setInputValue('');
        }
    };

    return <Space size={[0, 8]} wrap>
        <Space size={[0, 8]} wrap>
            {
                Array.isArray(value) && value.map(item => {
                    return <Tag
                        key={item.id}
                        closable
                        onClose={() => {
                            onChange && onChange(value.filter(it => it.id !== item.id))
                        }}
                    >
                        {item.label}
                    </Tag>
                })
            }
        </Space>
        {inputVisible ? (
            <Input
                ref={inputRef}
                type="text"
                size="small"
                style={tagInputStyle}
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                }}
                onBlur={handleInputConfirm}
                onPressEnter={handleInputConfirm}
                placeholder={'关键字'}
            />
        ) : (
            <Tag
                style={tagPlusStyle}
                onClick={() => {
                    setInputVisible(true);
                }}>
                <PlusOutlined/> 新增
            </Tag>
        )}
    </Space>

}

export default Tags
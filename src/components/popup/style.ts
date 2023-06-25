import {createStyles} from "antd-style"

export const useStyle = createStyles(({ prefixCls}) => ({
    upload: {
        [`.${prefixCls}-upload-select`]: {
            width: '100%',
            display: 'block'
        }
    }
}))
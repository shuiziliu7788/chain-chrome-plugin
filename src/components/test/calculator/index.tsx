import {Card, Divider} from "antd";
import Unit from "./unit";
import Timestamp from "./timestamp";

export const Calculator = ()=>{
    return <>
        <Card
            className={'tool-card'}
        >
            <Divider>UNIT</Divider>
            <Unit/>
            <Divider>日期</Divider>
            <Timestamp/>
        </Card>
    </>
}

export default Calculator
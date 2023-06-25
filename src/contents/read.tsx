import type {PlasmoCSConfig} from "plasmo"
import {InjectReadPage} from "@/components";
import {useEffect} from "react";

export const config: PlasmoCSConfig = {
    matches: [
        "https://*/readContract*",
    ],
    css: ["./read.less"],
    all_frames: true
}


export default () => {

    useEffect(() => {
        InjectReadPage()
    }, [])

    return <></>
}


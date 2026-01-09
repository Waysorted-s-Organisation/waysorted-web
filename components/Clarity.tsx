"use client";

import { useEffect } from "react";
import { init } from "@microsoft/clarity";

export default function Clarity() {
    useEffect(() => {
        init("uycxde58x1");
    }, []);

    return null;
}

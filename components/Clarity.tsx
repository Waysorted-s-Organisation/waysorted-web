"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

export default function ClarityTracking() {
    useEffect(() => {
        Clarity.init("uycxde58x1");
    }, []);

    return null;
}

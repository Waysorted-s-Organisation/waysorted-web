"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export default function ClarityTracking() {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const timeout = window.setTimeout(() => setEnabled(true), 12_000);
        return () => window.clearTimeout(timeout);
    }, []);

    if (!enabled) return null;

    return (
        <Script
            id="microsoft-clarity"
            strategy="lazyOnload"
        >
            {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "uycxde58x1");
            `}
        </Script>
    );
}

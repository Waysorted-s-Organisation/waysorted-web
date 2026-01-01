'use client';
import { useEffect } from 'react';
import Script from 'next/script';

declare global {
    interface Window {
        googleTranslateElementInit?: () => void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        google?: any;
    }
}

const GoogleTranslate = () => {
    useEffect(() => {
        window.googleTranslateElementInit = () => {
            if (window.google && window.google.translate) {
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: 'en',
                        includedLanguages: 'en,hi',
                        autoDisplay: false,
                        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    },
                    'google_translate_element'
                );
            }
        };
    }, []);

    return (
        <>
            <div id="google_translate_element" style={{ display: 'none' }} />
            <Script
                src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
                strategy="afterInteractive"
            />
            <style jsx global>{`
        /* Hide Google Translate top bar */
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
        }
        body {
          top: 0px !important;
        }
        /* Hide "Suggest an edit" tooltip */
        .goog-tooltip {
          display: none !important;
        }
        .goog-tooltip:hover {
          display: none !important;
        }
        .goog-text-highlight {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        /* Hide the google translate element if somehow visible */
        #google_translate_element {
          display: none;
        }
        /* Fix google transform messing with font sizes */
        font {
          background-color: transparent !important;
          box-shadow: none !important;
        }
      `}</style>
        </>
    );
};

export default GoogleTranslate;

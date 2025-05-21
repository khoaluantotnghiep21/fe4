'use client';

import { useEffect, useState } from 'react';

export default function useClientReady() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const fontReady = document.fonts?.ready || Promise.resolve();
        fontReady.then(() => {
            setReady(true);
        });
    }, []);

    return ready;
}

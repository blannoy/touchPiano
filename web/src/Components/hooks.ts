import { useRef, useEffect } from 'react';

export function useInterval(callback: Function, delay: number | null) {
    const savedCallback = useRef<Function>(() => {});

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        function tick() {
            savedCallback.current();
        }

        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }

        return () => { };
    }, [delay]);
}
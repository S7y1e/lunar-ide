import { useEffect, useState } from "react";
import { readSettings, writeSettings, SettingsValues } from "../../../lib/settings";

export function useSettings() {
    const [values, setValues] = useState<SettingsValues>({});
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        readSettings().then((v) => {
            setValues(v);
            setLoaded(true);
        });
    }, []);

    useEffect(() => {
        if (loaded) writeSettings(values);
    }, [values, loaded]);

    const setValue = (key: string, value: unknown) =>
        setValues((prev) => ({ ...prev, [key]: value }));

    const resetValue = (key: string) =>
        setValues((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });

    return { values, loaded, setValue, resetValue };
}

import { useState } from "react";
import { VscChevronDown } from "react-icons/vsc";
import styles from "./toolchain.module.scss";

type Props = {
    repo: string;
    current: string;
    disabled: boolean;
    onPick: (version: string) => void;
};

type Release = { tag_name: string };

export default function VersionPicker({ repo, current, disabled, onPick }: Props) {
    const [open, setOpen] = useState(false);
    const [versions, setVersions] = useState<string[] | null>(null);
    const [loading, setLoading] = useState(false);

    const toggle = async () => {
        if (open) {
            setOpen(false);
            return;
        }
        setOpen(true);
        if (versions === null && !loading) {
            setLoading(true);
            try {
                const res = await fetch(
                    `https://api.github.com/repos/${repo}/releases?per_page=30`
                );
                if (!res.ok) throw new Error();
                const data: Release[] = await res.json();
                setVersions(data.map((r) => r.tag_name.replace(/^v/, "")));
            } catch {
                setVersions([]);
            }
            setLoading(false);
        }
    };

    const pick = (version: string) => {
        setOpen(false);
        onPick(version);
    };

    return (
        <div className={styles.versionPicker}>
            <button
                className={styles.versionBtn}
                disabled={disabled}
                onClick={toggle}
            >
                {current || "latest"}
                <VscChevronDown size={11} />
            </button>
            {open && (
                <div className={styles.versionMenu}>
                    {loading ? (
                        <div className={styles.versionHint}>Loading…</div>
                    ) : versions && versions.length > 0 ? (
                        versions.map((version) => (
                            <button
                                key={version}
                                className={`${styles.versionItem} ${
                                    version === current ? styles.versionCurrent : ""
                                }`}
                                onClick={() => pick(version)}
                            >
                                {version}
                            </button>
                        ))
                    ) : (
                        <div className={styles.versionHint}>No versions found</div>
                    )}
                </div>
            )}
        </div>
    );
}

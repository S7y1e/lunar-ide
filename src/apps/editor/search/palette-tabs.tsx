import styles from "./search.module.scss";

const TABS = ["All", "Classes", "Files", "Symbols", "Actions", "Text"];

export default function PaletteTabs() {
    return (
        <div className={styles.paletteTabs}>
            {TABS.map((tab) => (
                <span
                    key={tab}
                    className={`${styles.paletteTab} ${
                        tab === "Files" ? styles.paletteTabActive : ""
                    }`}
                >
                    {tab}
                </span>
            ))}
        </div>
    );
}

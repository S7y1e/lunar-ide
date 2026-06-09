import styles from "./file-tree.module.scss";

export type MenuItem = {
    label: string;
    onClick: () => void;
    danger?: boolean;
};

type Props = {
    x: number;
    y: number;
    items: MenuItem[];
    onClose: () => void;
};

export default function ContextMenu({ x, y, items, onClose }: Props) {
    return (
        <div
            className={styles.contextOverlay}
            onClick={onClose}
            onContextMenu={(e) => {
                e.preventDefault();
                onClose();
            }}
        >
            <div
                className={styles.contextMenu}
                style={{ top: y, left: x }}
                onClick={(e) => e.stopPropagation()}
            >
                {items.map((item) => (
                    <button
                        key={item.label}
                        className={`${styles.contextItem} ${item.danger ? styles.danger : ""}`}
                        onClick={() => {
                            item.onClick();
                            onClose();
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

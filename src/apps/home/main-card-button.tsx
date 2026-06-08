import React from "react";
import styles from "./style.module.scss";

type Props = {
    clicked: React.MouseEventHandler;
    title: string;
    description: string;
};

export default function MainCardButton({ clicked, title, description }: Props) {
    return (
        <button className={styles.card} onClick={clicked}>
            <span className={styles.cardTitle}>{title}</span>
            <span className={styles.cardDesc}>{description}</span>
        </button>
    );
}

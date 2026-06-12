import MainCardButton from "./main-card-button";
import styles from "./style.module.scss";
import React from "react";

type Props = {
    onOpen: React.MouseEventHandler;
    onCreate: React.MouseEventHandler;
};

export default function MainCard({ onOpen, onCreate }: Props) {
    return (
        <div className={styles.cards}>
            <MainCardButton
                title="+ Create New Game"
                description="Start a fresh project with a ready-to-use template"
                clicked={onCreate}
            />
            <MainCardButton
                title="Open Existing Project"
                description="Open a folder that already has a default.project.json"
                clicked={onOpen}
            />
        </div>
    );
}

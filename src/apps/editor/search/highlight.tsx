import styles from "./search.module.scss";

type Props = {
    text: string;
    query: string;
};

export default function Highlight({ text, query }: Props) {
    if (!query) return <>{text}</>;
    const i = text.toLowerCase().indexOf(query.toLowerCase());
    if (i < 0) return <>{text}</>;
    return (
        <>
            {text.slice(0, i)}
            <mark className={styles.paletteMark}>
                {text.slice(i, i + query.length)}
            </mark>
            {text.slice(i + query.length)}
        </>
    );
}

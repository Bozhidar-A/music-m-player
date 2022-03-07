import React from 'react';
import IPageProps from '../interfaces/page';
import styles from "../styles/Components.module.css"

const FourOFour: React.FunctionComponent<IPageProps> = props => {
    return (
        <div>
            <h1 className={styles.WhiteCenteredText}>404 Page not found</h1>
        </div>
    );
}

export default FourOFour;
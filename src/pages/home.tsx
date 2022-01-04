import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, Container } from 'reactstrap';
import ProfileDropdown from '../components/ProfileDropdown';
import { auth } from '../config/firebase';
import IPageProps from '../interfaces/page';
import styles from "../styles/Components.module.css"

const HomePage: React.FunctionComponent<IPageProps> = props => {
    return (
        <div className={styles.Mainpage}>
            {/* <ProfileDropdown></ProfileDropdown> */}
            <p>
                Welcome to music-m-player!
            </p>
                {auth.currentUser === null ? <p> Click <Link to='/login'>here</Link> to login.</p> : <div>
                    <p>
                    Click <Link to='/playlistpicker'>here</Link> to go to playlist picker.
                    </p>
                </div>  }
        </div>
    );
}

export default HomePage;
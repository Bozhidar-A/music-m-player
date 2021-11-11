import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, Container } from 'reactstrap';
import ProfileDropdown from '../components/ProfileDropdown';
import { auth } from '../config/firebase';
import IPageProps from '../interfaces/page';

const HomePage: React.FunctionComponent<IPageProps> = props => {
    return (
        <Container>
            <Card>
                <CardBody>
                    <p>
                        Welcome to music-m-player!
                    </p>
                    {auth.currentUser === null ? <p> Click <Link to='/login'>here</Link> to login.</p> : <div>
                        <ProfileDropdown></ProfileDropdown>
                        <p>
                            Click <Link to='/playlistpicker'>here</Link> to go to playlist picker.
                        </p>
                    </div>  }
                    
                </CardBody>
            </Card>
        </Container>
    );
}

export default HomePage;
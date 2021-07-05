import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, Container } from 'reactstrap';
import IPageProps from '../interfaces/page';

const FourOFour: React.FunctionComponent<IPageProps> = props => {
    return (
        <div>
            <h1>404 Page not found</h1>
        </div>
    );
}

export default FourOFour;
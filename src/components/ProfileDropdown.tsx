import { useState } from "react";
import { Link } from "react-router-dom";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "reactstrap";
import { auth } from "../config/firebase";
import styles from "../styles/Components.module.css"

import 'bootstrap/dist/css/bootstrap.min.css';

function ProfileDropdown()
{
    let authedOptions;

    const [dropdownOpen, setDropdownOpen] = useState(false);

    function ToggleDropdown()
    {
        setDropdownOpen(!dropdownOpen);
    }

    if(auth.currentUser === null)//not logged in
    {
        authedOptions = 
        <>
            <DropdownItem><Link to='/login'>Login</Link></DropdownItem>
        </>
    }
    else if(auth.currentUser?.providerData[0]?.providerId !== 'password')
    {
        authedOptions = 
        <>
            <DropdownItem><Link to='/logout'>Logout</Link></DropdownItem>
        </>
    }
    else
    {
        authedOptions = 
        <>
            <DropdownItem><Link to="/change">Change your password </Link></DropdownItem>
            <DropdownItem><Link to='/logout'>Logout</Link></DropdownItem>
        </>
    }

    return(<div className={styles.ProfileDropdown}>
        <Dropdown isOpen={dropdownOpen} toggle={ToggleDropdown}>
            <DropdownToggle caret>
                Profile
            </DropdownToggle>
            <DropdownMenu right>
                {authedOptions}
            </DropdownMenu>
        </Dropdown>
    </div>)
}

export default ProfileDropdown;
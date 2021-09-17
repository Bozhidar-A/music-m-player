import { Link } from "react-router-dom";

function ProfileDropdown()
{
    return(<div>
        <p>Change your password <Link to="/change">here</Link>.</p>
        <p>Click <Link to='/logout'>here</Link> to logout.</p>
    </div>)
}

export default ProfileDropdown;
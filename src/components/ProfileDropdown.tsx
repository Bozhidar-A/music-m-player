import { Link } from "react-router-dom";
import { auth } from "../config/firebase";

function ProfileDropdown()
{
    return(<div>
        {auth.currentUser?.providerData[0]?.providerId !== 'password' ? null : <p>Change your password <Link to="/change">here</Link>.</p>}
        <p>Click <Link to='/logout'>here</Link> to logout.</p>
    </div>)
}

export default ProfileDropdown;
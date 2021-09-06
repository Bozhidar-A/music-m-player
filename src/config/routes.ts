import FourOFour from "../components/FourOFour";
import Playlist from "../components/Playlist";
import IRoute from "../interfaces/route";
import ChangePasswordPage from "../pages/auth/change";
import ForgotPasswordPage from "../pages/auth/forgot";
import LoginPage from "../pages/auth/login";
import LogoutPage from "../pages/auth/logout";
import RegisterPage from "../pages/auth/register";
import ResetPasswordPage from "../pages/auth/reset";
import HomePage from "../pages/home";
import PlaylistPicker from "../components/PlaylistPicker";

const routes: IRoute[] = [
    {
        path: '/',
        exact: true,
        component: PlaylistPicker,
        name: 'Playlist Picker',
        protected: true
    },
    // {
    //     path: '/playlistpicker',
    //     exact: true,
    //     component: PlaylistPicker,
    //     name: 'PlaylistPicker',
    //     protected: true
    // },
    {
        path: '/register',
        exact: true,
        component: RegisterPage,
        name: 'Register Page',
        protected: false
    },
    {
        path: '/login',
        exact: true,
        component: LoginPage,
        name: 'Login Page',
        protected: false
    },
    {
        path: '/change',
        exact: true,
        component: ChangePasswordPage,
        name: 'Change Password Page',
        protected: true
    },
    {
        path: '/logout',
        exact: true,
        component: LogoutPage,
        name: 'Logout Page',
        protected: true
    },
    {
        path: '/forget',
        exact: true,
        component: ForgotPasswordPage,
        name: 'Forgot Password Page',
        protected: false
    },
    {
        path: '/reset',
        exact: true,
        component: ResetPasswordPage,
        name: 'Reset Password Page',
        protected: false
    },
    {
        path: '/playlist',
        exact: true,
        component: Playlist,
        name: 'Playlist',
        protected: true
    },
    {
        path: '/playlist/:uid',
        exact: false,
        component: Playlist,
        name: 'Playlist',
        protected: true
    },
    {
        path: '*',
        exact: true,
        component: FourOFour,
        name: '404',
        protected: false
    }
];

export default routes;

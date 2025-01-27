import './App.css';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUserData } from './store';


export const Logout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const clearSession = () => {
        dispatch(setUserData({}));
        localStorage.clear();
        navigate('./');
    };
    return (
        <div className='logoutComp'>
            <button onClick={clearSession}> Logout </button>
        </div>
    );
}
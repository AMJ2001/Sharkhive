import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUserData } from './store';


export const Logout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const clearSession = async () => {
        dispatch(setUserData({}));
        localStorage.clear();
        await fetch('https://localhost:8000/api/logout/', {
            method: 'POST',
            credentials: 'include',
        });
        navigate('./');
    };
    return (
        <div className='logoutComp'>
            <button onClick={clearSession}> Logout </button>
        </div>
    );
}

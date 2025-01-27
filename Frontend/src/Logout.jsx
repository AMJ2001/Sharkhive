import './App.css';
import { useNavigate } from 'react-router-dom';

export const Logout = () => {
    const navigate = useNavigate();
    const clearSession = () => {
        navigate('./signup');
    };
    return (
        <div className='logoutComp'>
            <button onClick={clearSession}> Logout </button>
        </div>
    );
}
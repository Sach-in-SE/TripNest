import { createContext, useState, useContext, useEffect } from "react";
import AuthService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        const data = await AuthService.signin(credentials);
        setUser(data);
        return data;
    };

    const signup = async (userData) => {
        const data = await AuthService.signup(userData);
        return data;
    };

    const logout = () => {
        AuthService.signout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
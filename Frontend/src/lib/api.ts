import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api/v1",
});

api.interceptors.request.use(
    (config) => {
        
        const isAdminRoute = window.location.pathname.startsWith('/admin');
        const token = isAdminRoute
            ? localStorage.getItem("admin_token")
            : localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;

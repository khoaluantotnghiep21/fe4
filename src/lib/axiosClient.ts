import axios from 'axios';

const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: tự động gắn access token nếu có
axiosClient.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: xử lý lỗi toàn cục
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const status = error.response.status;

            if (status === 401) {
                console.warn('401 Unauthorized - redirect to login or refresh token');
                // Bạn có thể redirect hoặc gọi API refresh token tại đây
            }

            if (status === 500) {
                console.error('Lỗi server, vui lòng thử lại sau.');
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;

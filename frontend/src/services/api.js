import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? (process.env.REACT_APP_API_URL || '/api')
    : 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
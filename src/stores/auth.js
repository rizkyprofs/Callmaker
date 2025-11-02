import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const auth = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null);
  const token = ref(localStorage.getItem('token'));

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const role = computed(() => user.value?.role || "user");

  function setUser(userData) {
    user.value = userData;
    localStorage.setItem('user', JSON.stringify(userData));
  }

  function setToken(newToken) {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return {
    user,
    token,
    role,
    isAuthenticated,
    setUser,
    setToken,
    logout
  };
});

export const useAuthStore = auth;

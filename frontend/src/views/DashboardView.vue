<!-- client/src/views/DashboardView.vue - FIXED VERSION -->
<template>
  <div class="dashboard">
    <div class="container">
      <!-- Header dengan Navbar -->
      <nav class="navbar">
        <div class="nav-brand">
          <h1>📊 Dashboard</h1>
        </div>
        <div class="nav-actions" v-if="user">
          <span class="user-welcome">Welcome, <strong>{{ user.name }}</strong> ({{ user.role }})</span>
          <button @click="handleLogout" class="logout-btn">🚪 Logout</button>
        </div>
        <div class="nav-actions" v-else>
          <button @click="goToLogin" class="login-btn">🔑 Login</button>
        </div>
      </nav>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-icon">📈</div>
          <div class="stat-info">
            <h3>TOTAL SIGNALS</h3>
            <p class="stat-number">{{ signals.length }}</p>
          </div>
        </div>
        <div class="stat-card pending">
          <div class="stat-icon">⏳</div>
          <div class="stat-info">
            <h3>PENDING SIGNALS</h3>
            <p class="stat-number">{{ pendingCount }}</p>
          </div>
        </div>
        <div class="stat-card approved">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>APPROVED SIGNALS</h3>
            <p class="stat-number">{{ approvedCount }}</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <div class="error-content">
          <h3>Error Loading Dashboard</h3>
          <p>{{ error }}</p>
          <div class="error-actions">
            <button @click="retryLoading" class="retry-btn">🔄 Try Again</button>
            <button @click="handleLogout" class="logout-btn-small">🔑 Re-login</button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else class="main-content">
        <!-- Actions Bar -->
        <div class="actions-bar">
          <h2>Your Trading Signals</h2>
          <div class="action-buttons">
            <button @click="refreshData" class="refresh-btn">🔄 Refresh Data</button>
            <button @click="createSignal" class="create-btn">➕ Create Signal</button>
          </div>
        </div>

        <!-- Signals Table -->
        <div class="content-card">
          <div v-if="signals.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No Signals Yet</h3>
            <p>Create your first trading signal to get started</p>
            <button @click="createSignal" class="create-btn">Create First Signal</button>
          </div>
          
          <div v-else class="signals-table-container">
            <table class="signals-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Symbol</th>
                  <th>Action</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Date Created</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="signal in signals" :key="signal.id" class="signal-row">
                  <td class="signal-name">{{ signal.name }}</td>
                  <td class="signal-symbol">
                    <span class="symbol-badge">{{ signal.symbol }}</span>
                  </td>
                  <td>
                    <span :class="['action-badge', signal.action.toLowerCase()]">
                      {{ signal.action }}
                    </span>
                  </td>
                  <td class="signal-price">${{ Number(signal.price).toFixed(2) }}</td>
                  <td>
                    <span :class="['status-badge', signal.status]">
                      {{ signal.status }}
                    </span>
                  </td>
                  <td class="signal-date">{{ formatDate(signal.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)
const signals = ref([])
const pendingCount = ref(0)
const loading = ref(true)
const error = ref(null)

// Computed values
const approvedCount = computed(() => {
  return signals.value.filter(signal => signal.status === 'approved').length
})

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Fetch user data dari database - ✅ ENDPOINT YANG BENAR
const fetchUserData = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    // ✅ ENDPOINT YANG BENAR: /api/auth/user
    const response = await fetch('http://localhost:5000/api/auth/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Session expired. Please login again.')
      }
      throw new Error(`Failed to fetch user data: ${response.status} - ${response.statusText}`)
    }

    const userData = await response.json()
    return userData
  } catch (err) {
    console.error('Error fetching user data:', err)
    throw err
  }
}

// Fetch signals dari database
const fetchSignals = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    const response = await fetch('http://localhost:5000/api/signals', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const signalsData = await response.json()
      signals.value = signalsData
    } else {
      console.warn('Failed to fetch signals:', response.status)
      signals.value = []
    }
  } catch (err) {
    console.error('Error fetching signals:', err)
    signals.value = []
  }
}

// Fetch pending count
const fetchPendingCount = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    // Hitung manual dari signals yang ada
    const pending = signals.value.filter(signal => signal.status === 'pending').length
    pendingCount.value = pending
  } catch (err) {
    console.error('Error counting pending:', err)
    pendingCount.value = 0
  }
}

// Load all dashboard data
const loadDashboardData = async () => {
  try {
    loading.value = true
    error.value = null

    // Check token first
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (!token) {
      router.push('/login')
      return
    }

    // Jika ada user di localStorage, tampilkan dulu
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (e) {
        console.warn('Invalid user data in localStorage')
      }
    }

    // Fetch user data from API
    const userData = await fetchUserData()
    user.value = userData
    
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(userData))

    // Fetch signals
    await fetchSignals()
    
    // Calculate pending count
    fetchPendingCount()

  } catch (err) {
    console.error('Error loading dashboard:', err)
    error.value = err.message
    
    // Clear invalid data
    if (err.message.includes('Session expired') || err.message.includes('token')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  } finally {
    loading.value = false
  }
}

// Navigation functions
const goToLogin = () => {
  router.push('/login')
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

const createSignal = () => {
  // Redirect to create signal page or show modal
  alert('Create signal functionality - Redirect to signal creation page')
}

const refreshData = async () => {
  await loadDashboardData()
}

const retryLoading = async () => {
  await loadDashboardData()
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* Navbar Styles */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px 30px;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  margin-bottom: 30px;
}

.nav-brand h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.8em;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-welcome {
  color: #34495e;
  font-weight: 500;
}

.logout-btn, .login-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 14px;
}

.login-btn {
  background: #27ae60;
}

.logout-btn:hover, .login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 25px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  border-left: 5px solid;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card.total {
  border-left-color: #3498db;
}

.stat-card.pending {
  border-left-color: #f39c12;
}

.stat-card.approved {
  border-left-color: #27ae60;
}

.stat-icon {
  font-size: 2.5em;
}

.stat-info h3 {
  margin: 0 0 8px 0;
  color: #7f8c8d;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-number {
  font-size: 2.2em;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 80px 20px;
  color: #7f8c8d;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  backdrop-filter: blur(10px);
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 30px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  margin-bottom: 30px;
}

.error-icon {
  font-size: 3em;
}

.error-content h3 {
  margin: 0 0 10px 0;
  color: #e74c3c;
}

.error-content p {
  margin: 0 0 15px 0;
  color: #666;
}

.error-actions {
  display: flex;
  gap: 10px;
}

.retry-btn, .logout-btn-small {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.retry-btn {
  background: #3498db;
  color: white;
}

.logout-btn-small {
  background: #95a5a6;
  color: white;
}

/* Main Content */
.main-content {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  padding: 30px;
  backdrop-filter: blur(10px);
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.actions-bar h2 {
  margin: 0;
  color: #2c3e50;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.refresh-btn, .create-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 14px;
}

.refresh-btn {
  background: #3498db;
  color: white;
}

.create-btn {
  background: #27ae60;
  color: white;
}

.refresh-btn:hover, .create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

/* Content Card */
.content-card {
  background: white;
  border-radius: 10px;
  padding: 0;
  overflow: hidden;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-icon {
  font-size: 4em;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.empty-state p {
  margin: 0 0 25px 0;
  font-size: 1.1em;
}

/* Signals Table */
.signals-table-container {
  overflow-x: auto;
}

.signals-table {
  width: 100%;
  border-collapse: collapse;
}

.signals-table th {
  background: #34495e;
  color: white;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85em;
  letter-spacing: 1px;
}

.signals-table td {
  padding: 15px;
  border-bottom: 1px solid #ecf0f1;
}

.signal-row:hover {
  background-color: #f8f9fa;
}

.signal-name {
  font-weight: 500;
  color: #2c3e50;
}

.symbol-badge {
  background: #e8f4fd;
  color: #2980b9;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85em;
}

.action-badge, .status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 600;
  text-transform: uppercase;
}

.action-badge.buy {
  background: #d5f4e6;
  color: #27ae60;
}

.action-badge.sell {
  background: #fde8e8;
  color: #e74c3c;
}

.action-badge.hold {
  background: #fef5e7;
  color: #f39c12;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.approved {
  background: #d1edff;
  color: #0c5460;
}

.status-badge.rejected {
  background: #f8d7da;
  color: #721c24;
}

.signal-price {
  font-weight: 600;
  color: #2c3e50;
}

.signal-date {
  color: #7f8c8d;
  font-size: 0.9em;
}

/* Responsive */
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-bar {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>
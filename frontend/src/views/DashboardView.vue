<!-- client/src/views/DashboardView.vue - FIXED VERSION -->
<template>
  <div class="dashboard">
    <div class="container">
      <!-- Header -->
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <div class="user-info" v-if="user">
          <span>Welcome, {{ user.name }} ({{ user.role }})</span>
          <button @click="handleLogout" class="logout-btn">Logout</button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Signals</h3>
          <p class="stat-number">{{ signals.length }}</p>
        </div>
        <div class="stat-card">
          <h3>Pending Signals</h3>
          <p class="stat-number">{{ pendingCount }}</p>
        </div>
        <div class="stat-card">
          <h3>Approved Signals</h3>
          <p class="stat-number">{{ approvedCount }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>❌ {{ error }}</p>
        <button @click="retryLoading" class="retry-btn">Try Again</button>
      </div>

      <!-- Signals Table -->
      <div v-else class="signals-section">
        <div class="section-header">
          <h2>Your Signals</h2>
          <button @click="refreshData" class="refresh-btn">🔄 Refresh</button>
        </div>
        
        <div v-if="signals.length === 0" class="no-signals">
          <p>No signals found. Create your first signal!</p>
        </div>
        
        <div v-else class="signals-table">
          <table>
            <thead>
              <tr>
                <th>Coin Name</th>
                <th>Entry Price</th>
                <th>Target Price</th>
                <th>Stop Loss</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="signal in signals" :key="signal.id">
                <td>{{ signal.coin_name }}</td>
                <td>${{ signal.entry_price }}</td>
                <td>${{ signal.target_price }}</td>
                <td>${{ signal.stop_loss }}</td>
                <td :class="signal.status">
                  <span class="status-badge">{{ signal.status }}</span>
                </td>
                <td>{{ formatDate(signal.created_at) }}</td>
              </tr>
            </tbody>
          </table>
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
    day: 'numeric'
  })
}

// ✅ FIXED: Fetch user data dari API, bukan localStorage
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
      throw new Error(`Failed to fetch user data: ${response.status}`)
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

    // ✅ Endpoint untuk signals (sesuai routes di backend)
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

    // Hitung manual dari signals
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
    if (!token) {
      router.push('/login')
      return
    }

    // ✅ FIXED: Fetch user data dari API, bukan localStorage
    const userData = await fetchUserData()
    user.value = userData

    // Fetch signals data
    await fetchSignals()
    
    // Calculate pending count
    fetchPendingCount()

  } catch (err) {
    console.error('Error loading dashboard:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Refresh data
const refreshData = async () => {
  await loadDashboardData()
}

// Retry loading
const retryLoading = async () => {
  await loadDashboardData()
}

// Logout
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logout-btn {
  background: #ff4757;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
}

.logout-btn:hover {
  background: #ff3742;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.stat-number {
  font-size: 2.5em;
  font-weight: bold;
  color: #2c3e50;
  margin: 10px 0 0 0;
}

.signals-section {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.signals-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.pending {
  color: #f39c12;
  font-weight: bold;
}

.approved {
  color: #27ae60;
  font-weight: bold;
}

.rejected {
  color: #e74c3c;
  font-weight: bold;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 600;
}

.pending .status-badge {
  background: #fff3cd;
  color: #856404;
}

.approved .status-badge {
  background: #d1edff;
  color: #0c5460;
}

.rejected .status-badge {
  background: #f8d7da;
  color: #721c24;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 40px 20px;
  background: #f8d7da;
  color: #721c24;
  border-radius: 10px;
  margin: 20px 0;
}

.retry-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 15px;
}

.no-signals {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 1.1em;
}

.refresh-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
}
</style>
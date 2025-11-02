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
        <button @click="retryLoading" class="retry-btn">Retry</button>
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
                <th>Name</th>
                <th>Symbol</th>
                <th>Action</th>
                <th>Price</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="signal in signals" :key="signal.id">
                <td>{{ signal.name }}</td>
                <td><strong>{{ signal.symbol }}</strong></td>
                <td :class="signal.action.toLowerCase()">{{ signal.action }}</td>
                <td>${{ signal.price }}</td>
                <td :class="signal.status">
                  <span class="status-badge">{{ signal.status }}</span>
                </td>
                <td>{{ formatDate(signal.createdAt) }}</td>
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

// Fetch user data dari database
const fetchUserData = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch('http://localhost:5000/api/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Token invalid
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        throw new Error('Session expired. Please login again.')
      }
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

    const response = await fetch('http://localhost:5000/api/signals/user', {
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

    const response = await fetch('http://localhost:5000/api/signals/pending/count', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      pendingCount.value = data.count
    } else {
      console.warn('Failed to fetch pending count:', response.status)
      pendingCount.value = 0
    }
  } catch (err) {
    console.error('Error fetching pending count:', err)
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

    // Fetch user data from API (not localStorage)
    const userData = await fetchUserData()
    user.value = userData
    
    // Save to localStorage for other components
    localStorage.setItem('user', JSON.stringify(userData))

    // Fetch other data in parallel
    await Promise.all([
      fetchSignals(),
      fetchPendingCount()
    ])

  } catch (err) {
    console.error('Error loading dashboard:', err)
    error.value = err.message
    
    // Redirect to login if authentication failed
    if (err.message.includes('Session expired') || err.message.includes('token')) {
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: rgba(255, 255, 255, 0.95);
  padding: 20px 30px;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
}

.dashboard-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 2em;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  font-weight: 500;
  color: #34495e;
}

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #c0392b;
  transform: translateY(-2px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 25px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card h3 {
  margin: 0 0 10px 0;
  color: #7f8c8d;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-number {
  font-size: 2.5em;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

.signals-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  color: #2c3e50;
}

.refresh-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.signals-table {
  overflow-x: auto;
  border-radius: 10px;
  background: white;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th, td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

th {
  background-color: #34495e;
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85em;
  letter-spacing: 1px;
}

tr:hover {
  background-color: #f8f9fa;
}

.buy {
  color: #27ae60;
  font-weight: bold;
}

.sell {
  color: #e74c3c;
  font-weight: bold;
}

.hold {
  color: #f39c12;
  font-weight: bold;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 600;
  text-transform: uppercase;
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
  color: #7f8c8d;
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

.retry-btn:hover {
  background: #c82333;
}

.no-signals {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
  font-size: 1.1em;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
}
</style>
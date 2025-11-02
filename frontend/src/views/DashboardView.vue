<template>
  <div class="dashboard">
    <div class="container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading dashboard...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>❌ {{ error }}</p>
        <button @click="retryLoading" class="retry-btn">Try Again</button>
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </div>

      <!-- Main Content (HANYA tampilkan jika user ada) -->
      <div v-else-if="user" class="main-content">
        <!-- Header dengan Role Info -->
        <div class="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <div class="role-badge" :class="user.role">
              {{ user.role.toUpperCase() }}
            </div>
          </div>
          <div class="user-info">
            <span>Welcome, {{ user.name }}</span>
            <button @click="handleLogout" class="logout-btn">Logout</button>
          </div>
        </div>

        <!-- Admin & Callmaker Features -->
        <div v-if="user.role === 'admin' || user.role === 'callmaker'" class="admin-features">
          <div class="features-grid">
            <button @click="showCreateModal = true" class="feature-btn create-btn">
              ➕ Create New Signal
            </button>
            
            <!-- Admin Only Features -->
            <div v-if="user.role === 'admin'" class="admin-only">
              <button @click="showPendingSignals" class="feature-btn pending-btn">
                ⏳ Pending Signals ({{ pendingCount }})
              </button>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card total">
            <h3>Total Signals</h3>
            <p class="stat-number">{{ signals.length }}</p>
          </div>
          
          <div class="stat-card pending">
            <h3>Pending Signals</h3>
            <p class="stat-number">{{ pendingCount }}</p>
          </div>
          
          <div class="stat-card approved">
            <h3>Approved Signals</h3>
            <p class="stat-number">{{ approvedCount }}</p>
          </div>

          <!-- User-specific stat -->
          <div v-if="user.role === 'callmaker'" class="stat-card my-signals">
            <h3>My Signals</h3>
            <p class="stat-number">{{ mySignalsCount }}</p>
          </div>
        </div>

        <!-- Signals Table -->
        <div class="signals-section">
          <div class="section-header">
            <h2>
              <span v-if="user.role === 'user'">Trading Signals</span>
              <span v-else-if="user.role === 'callmaker'">My Signals</span>
              <span v-else>All Signals</span>
            </h2>
            <button @click="refreshData" class="refresh-btn">🔄 Refresh</button>
          </div>
          
          <!-- Empty State -->
          <div v-if="signals.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No Signals Found</h3>
            <p v-if="user.role === 'user'">Check back later for new trading signals</p>
            <p v-else-if="user.role === 'callmaker'">Create your first signal to get started</p>
            <p v-else>No signals in the system yet</p>
            
            <button 
              v-if="user.role === 'callmaker'" 
              @click="showCreateModal = true" 
              class="create-btn"
            >
              Create First Signal
            </button>
          </div>
          
          <!-- Signals Table -->
          <div v-else class="signals-table-container">
            <table class="signals-table">
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Entry Price</th>
                  <th>Target Price</th>
                  <th>Stop Loss</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th v-if="user.role !== 'user'">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="signal in signals" :key="signal.id" class="signal-row">
                  <td class="coin-name">{{ signal.coin_name }}</td>
                  <td>${{ signal.entry_price }}</td>
                  <td>${{ signal.target_price }}</td>
                  <td>${{ signal.stop_loss }}</td>
                  <td>
                    <span :class="['status-badge', signal.status]">
                      {{ signal.status }}
                    </span>
                  </td>
                  <td class="signal-date">{{ formatDate(signal.created_at) }}</td>
                  
                  <!-- Role-based Actions -->
                  <td v-if="user.role !== 'user'" class="actions">
                    <!-- Admin can approve/reject -->
                    <div v-if="user.role === 'admin'" class="admin-actions">
                      <button 
                        v-if="signal.status === 'pending'"
                        @click="approveSignal(signal.id)"
                        class="action-btn approve-btn"
                      >
                        ✅ Approve
                      </button>
                      <button 
                        v-if="signal.status === 'pending'"
                        @click="rejectSignal(signal.id)"
                        class="action-btn reject-btn"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Create Signal Modal -->
        <div v-if="showCreateModal" class="modal-overlay">
          <div class="modal">
            <h3>Create New Signal</h3>
            <form @submit.prevent="createSignal">
              <input v-model="newSignal.coin_name" placeholder="Coin Name" required>
              <input v-model="newSignal.entry_price" type="number" placeholder="Entry Price" required>
              <input v-model="newSignal.target_price" type="number" placeholder="Target Price" required>
              <input v-model="newSignal.stop_loss" type="number" placeholder="Stop Loss" required>
              <textarea v-model="newSignal.note" placeholder="Notes (optional)"></textarea>
              
              <div class="modal-actions">
                <button type="button" @click="showCreateModal = false" class="cancel-btn">Cancel</button>
                <button type="submit" class="submit-btn">Create Signal</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Fallback jika user masih null (seharusnya tidak terjadi) -->
      <div v-else class="error-state">
        <p>❌ Failed to load user data</p>
        <button @click="handleLogout" class="logout-btn">Go to Login</button>
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
const loading = ref(true)
const error = ref(null)
const showCreateModal = ref(false)

const newSignal = ref({
  coin_name: '',
  entry_price: '',
  target_price: '',
  stop_loss: '',
  note: ''
})

// Computed values dengan null check
const pendingCount = computed(() => {
  return signals.value.filter(signal => signal.status === 'pending').length
})

const approvedCount = computed(() => {
  return signals.value.filter(signal => signal.status === 'approved').length
})

const mySignalsCount = computed(() => {
  if (user.value && user.value.role === 'callmaker') {
    return signals.value.filter(signal => signal.created_by === user.value.id).length
  }
  return 0
})

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Fetch user data dengan better error handling
const fetchUserData = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch('http://localhost:5000/api/auth/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
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

// Fetch signals
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

// Load all dashboard data
const loadDashboardData = async () => {
  try {
    loading.value = true
    error.value = null
    user.value = null // Reset user

    // Check token first
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Fetch user data
    const userData = await fetchUserData()
    user.value = userData

    // Fetch signals
    await fetchSignals()

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

// Role-based functions
const createSignal = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('http://localhost:5000/api/signals', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newSignal.value)
    })

    if (response.ok) {
      showCreateModal.value = false
      newSignal.value = { coin_name: '', entry_price: '', target_price: '', stop_loss: '', note: '' }
      await refreshData()
      alert('Signal created successfully!')
    } else {
      alert('Failed to create signal')
    }
  } catch (err) {
    console.error('Error creating signal:', err)
    alert('Failed to create signal')
  }
}

const approveSignal = async (signalId) => {
  if (!confirm('Approve this signal?')) return
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:5000/api/signals/${signalId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'approved' })
    })

    if (response.ok) {
      await refreshData()
      alert('Signal approved!')
    }
  } catch (err) {
    console.error('Error approving signal:', err)
    alert('Failed to approve signal')
  }
}

const rejectSignal = async (signalId) => {
  if (!confirm('Reject this signal?')) return
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:5000/api/signals/${signalId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'rejected' })
    })

    if (response.ok) {
      await refreshData()
      alert('Signal rejected!')
    }
  } catch (err) {
    console.error('Error rejecting signal:', err)
    alert('Failed to reject signal')
  }
}

const refreshData = async () => {
  await loadDashboardData()
}

const retryLoading = async () => {
  await loadDashboardData()
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

const showPendingSignals = () => {
  // Filter untuk show pending signals
  signals.value = signals.value.filter(signal => signal.status === 'pending')
}

onMounted(() => {
  loadDashboardData()
})
</script>
<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: white;
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  background: white;
  padding: 40px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.error-state p {
  font-size: 18px;
  margin-bottom: 20px;
  color: #e74c3c;
}

.retry-btn, .logout-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin: 0 10px;
  transition: all 0.3s ease;
}

.retry-btn {
  background: #3498db;
  color: white;
}

.logout-btn {
  background: #e74c3c;
  color: white;
}

.retry-btn:hover, .logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* Main Content */
.main-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f3f4;
}

.dashboard-header h1 {
  font-size: 2.5em;
  color: #2c3e50;
  margin: 0;
  font-weight: 700;
}

.role-badge {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 25px;
  font-size: 0.9em;
  font-weight: bold;
  text-transform: uppercase;
  margin-top: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.role-badge.admin {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.role-badge.callmaker {
  background: linear-gradient(45deg, #f39c12, #e67e22);
  color: white;
}

.role-badge.user {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
}

.user-info {
  text-align: right;
}

.user-info span {
  display: block;
  font-size: 1.1em;
  color: #2c3e50;
  margin-bottom: 10px;
  font-weight: 600;
}

/* Admin Features */
.admin-features {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.feature-btn {
  padding: 15px 25px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1em;
  transition: all 0.3s ease;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.create-btn {
  background: linear-gradient(45deg, #27ae60, #2ecc71);
  color: white;
}

.pending-btn {
  background: linear-gradient(45deg, #f39c12, #f1c40f);
  color: white;
}

.feature-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  border-left: 5px solid;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: inherit;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.stat-card.total {
  border-left-color: #3498db;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.stat-card.pending {
  border-left-color: #f39c12;
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
}

.stat-card.approved {
  border-left-color: #27ae60;
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
}

.stat-card.my-signals {
  border-left-color: #9b59b6;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
}

.stat-card h3 {
  margin: 0 0 15px 0;
  font-size: 1em;
  opacity: 0.9;
  font-weight: 600;
}

.stat-number {
  font-size: 2.5em;
  font-weight: 700;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

/* Signals Section */
.signals-section {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f1f3f4;
}

.section-header h2 {
  color: #2c3e50;
  font-size: 1.8em;
  margin: 0;
  font-weight: 700;
}

.refresh-btn {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
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
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5em;
  margin-bottom: 10px;
  color: #2c3e50;
}

.empty-state p {
  margin-bottom: 25px;
  font-size: 1.1em;
}

/* Table Styles */
.signals-table-container {
  overflow-x: auto;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.signals-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.signals-table th {
  background: linear-gradient(135deg, #34495e, #2c3e50);
  color: white;
  padding: 18px 15px;
  text-align: left;
  font-weight: 600;
  font-size: 0.95em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.signals-table td {
  padding: 18px 15px;
  border-bottom: 1px solid #ecf0f1;
  transition: all 0.2s ease;
}

.signal-row:hover {
  background: #f8f9fa;
  transform: scale(1.01);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.coin-name {
  font-weight: 700;
  color: #2c3e50;
  font-size: 1.1em;
}

.signal-date {
  color: #7f8c8d;
  font-size: 0.9em;
}

/* Status Badges */
.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-badge.approved {
  background: #d1f7e9;
  color: #155724;
  border: 1px solid #b7ebce;
}

.status-badge.rejected {
  background: #fde8e8;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Actions */
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8em;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.approve-btn {
  background: linear-gradient(45deg, #27ae60, #2ecc71);
  color: white;
}

.reject-btn {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.delete-btn {
  background: linear-gradient(45deg, #95a5a6, #7f8c8d);
  color: white;
}

.edit-btn {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal {
  background: white;
  padding: 40px;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal h3 {
  margin: 0 0 25px 0;
  color: #2c3e50;
  font-size: 1.5em;
  text-align: center;
}

.modal input, .modal textarea {
  width: 100%;
  padding: 15px;
  margin-bottom: 20px;
  border: 2px solid #ecf0f1;
  border-radius: 10px;
  font-size: 1em;
  transition: all 0.3s ease;
}

.modal input:focus, .modal textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.modal textarea {
  min-height: 100px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 25px;
}

.cancel-btn, .submit-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}

.submit-btn {
  background: linear-gradient(45deg, #27ae60, #2ecc71);
  color: white;
}

.cancel-btn:hover, .submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard {
    padding: 10px;
  }
  
  .main-content {
    padding: 20px 15px;
  }
  
  .dashboard-header {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .user-info {
    text-align: center;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .signals-table {
    font-size: 0.9em;
  }
  
  .actions {
    justify-content: center;
  }
  
  .modal {
    padding: 25px 20px;
    margin: 20px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}

/* Animation for table rows */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.signal-row {
  animation: fadeIn 0.5s ease-out;
}

/* Custom scrollbar */
.signals-table-container::-webkit-scrollbar {
  height: 8px;
}

.signals-table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.signals-table-container::-webkit-scrollbar-thumb {
  background: linear-gradient(45deg, #3498db, #2980b9);
  border-radius: 4px;
}

.signals-table-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(45deg, #2980b9, #21618c);
}
</style>
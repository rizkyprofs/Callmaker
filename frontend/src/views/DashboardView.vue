<!-- src/views/DashboardView.vue - COMPLETE VERSION -->
<template>
  <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #ddd;">
      <h1>Callmaker Dashboard</h1>
      <div style="display: flex; align-items: center; gap: 15px;">
        <span>Hello, {{ user?.username }}</span>
        <span style="background: #007bff; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
          {{ user?.role }}
        </span>
        <button @click="logout" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 5px;">
          Logout
        </button>
      </div>
    </div>

    <!-- Admin Notification -->
    <div v-if="user?.role === 'admin' && pendingCount > 0" style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
      <strong>📢 Admin Alert:</strong> You have {{ pendingCount }} signals waiting for approval
    </div>

    <!-- Signal Form untuk Callmaker & Admin -->
    <div v-if="['callmaker', 'admin'].includes(user?.role)" style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #ddd;">
      <h3>📈 Submit New Signal</h3>
      <form @submit.prevent="submitSignal" style="display: flex; flex-direction: column; gap: 15px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <input v-model="newSignal.coin_name" placeholder="Coin (e.g., BTC/USDT)" required style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          <input v-model="newSignal.entry_price" type="number" step="0.0001" placeholder="Entry Price" required style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <input v-model="newSignal.target_price" type="number" step="0.0001" placeholder="Target Price" required style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          <input v-model="newSignal.stop_loss" type="number" step="0.0001" placeholder="Stop Loss" required style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        <textarea v-model="newSignal.note" placeholder="Analysis note..." style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; min-height: 80px;"></textarea>
        <button type="submit" :disabled="loading" style="background: #007bff; color: white; padding: 12px; border: none; border-radius: 5px;">
          {{ loading ? 'Submitting...' : (user?.role === 'admin' ? 'Publish Signal' : 'Submit for Approval') }}
        </button>
      </form>
    </div>

    <!-- Signals List -->
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>📊 Trading Signals</h2>
        <select v-model="statusFilter" @change="fetchSignals" style="padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
          <option value="all">All Signals</option>
          <option value="pending" v-if="user?.role !== 'user'">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected" v-if="user?.role !== 'user'">Rejected</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="loading" style="text-align: center; padding: 40px;">
        Loading signals...
      </div>

      <!-- Signals Grid -->
      <div v-else style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
        <div v-for="signal in filteredSignals" :key="signal.id" style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd; border-left: 4px solid #007bff;">
          <!-- Signal Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0;">{{ signal.coin_name }}</h3>
            <span :style="{
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold',
              background: signal.status === 'approved' ? '#d4edda' : signal.status === 'pending' ? '#fff3cd' : '#f8d7da',
              color: signal.status === 'approved' ? '#155724' : signal.status === 'pending' ? '#856404' : '#721c24'
            }">
              {{ signal.status }}
            </span>
          </div>
          
          <!-- Prices -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
            <div style="text-align: center;">
              <div style="font-size: 12px; color: #666;">Entry</div>
              <strong>${{ signal.entry_price }}</strong>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 12px; color: #666;">Target</div>
              <strong style="color: #28a745;">${{ signal.target_price }}</strong>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 12px; color: #666;">Stop Loss</div>
              <strong style="color: #dc3545;">${{ signal.stop_loss }}</strong>
            </div>
          </div>

          <!-- Note -->
          <div v-if="signal.note" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            <p style="margin: 0; font-size: 14px;">{{ signal.note }}</p>
          </div>

          <!-- Footer -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
            <div style="font-size: 12px; color: #666;">
              <div>By: {{ signal.creator?.username }}</div>
              <div>{{ formatDate(signal.created_at) }}</div>
            </div>
            
            <!-- Actions -->
            <div style="display: flex; gap: 5px;">
              <!-- Admin Actions -->
              <button 
                v-if="user?.role === 'admin' && signal.status === 'pending'"
                @click="updateSignalStatus(signal.id, 'approved')"
                style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px; font-size: 12px;"
              >
                Approve
              </button>
              <button 
                v-if="user?.role === 'admin' && signal.status === 'pending'"
                @click="updateSignalStatus(signal.id, 'rejected')"
                style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; font-size: 12px;"
              >
                Reject
              </button>
              
              <!-- Delete Button (Admin atau Creator) -->
              <button 
                v-if="user?.role === 'admin' || signal.created_by === user?.id"
                @click="deleteSignal(signal.id)"
                style="background: #6c757d; color: white; border: none; padding: 5px 10px; border-radius: 3px; font-size: 12px;"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && signals.length === 0" style="text-align: center; padding: 40px; color: #666;">
        No signals found
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)
const signals = ref([])
const loading = ref(false)
const pendingCount = ref(0)
const statusFilter = ref('all')
const newSignal = ref({
  coin_name: '',
  entry_price: '',
  target_price: '',
  stop_loss: '',
  note: ''
})

// Filter signals berdasarkan status
const filteredSignals = computed(() => {
  if (statusFilter.value === 'all') return signals.value
  return signals.value.filter(signal => signal.status === statusFilter.value)
})

// Fetch signals dari backend
const fetchSignals = async () => {
  try {
    loading.value = true
    const token = localStorage.getItem('token')
    
    const response = await fetch('http://localhost:5000/api/signals', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) throw new Error('Failed to fetch signals')
    
    signals.value = await response.json()
  } catch (error) {
    console.error('Error fetching signals:', error)
    alert('Failed to load signals')
  } finally {
    loading.value = false
  }
}

// Fetch pending count untuk admin
const fetchPendingCount = async () => {
  if (user.value?.role === 'admin') {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/signals/pending/count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        pendingCount.value = data.count
      }
    } catch (error) {
      console.error('Error fetching pending count:', error)
    }
  }
}

// Submit new signal
const submitSignal = async () => {
  try {
    loading.value = true
    const token = localStorage.getItem('token')
    
    const response = await fetch('http://localhost:5000/api/signals', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newSignal.value)
    })
    
    const data = await response.json()
    
    if (!response.ok) throw new Error(data.message)
    
    alert(data.message)
    // Reset form
    newSignal.value = { coin_name: '', entry_price: '', target_price: '', stop_loss: '', note: '' }
    // Refresh signals
    fetchSignals()
    fetchPendingCount()
  } catch (error) {
    console.error('Error creating signal:', error)
    alert(error.message || 'Failed to create signal')
  } finally {
    loading.value = false
  }
}

// Update signal status (admin only)
const updateSignalStatus = async (signalId, status) => {
  if (!confirm(`Are you sure you want to ${status} this signal?`)) return
  
  try {
    const token = localStorage.getItem('token')
    
    const response = await fetch(`http://localhost:5000/api/signals/${signalId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    })
    
    const data = await response.json()
    
    if (!response.ok) throw new Error(data.message)
    
    alert(`Signal ${status}`)
    fetchSignals()
    fetchPendingCount()
  } catch (error) {
    console.error('Error updating signal:', error)
    alert(error.message || 'Failed to update signal')
  }
}

// Delete signal
const deleteSignal = async (signalId) => {
  if (!confirm('Are you sure you want to delete this signal?')) return
  
  try {
    const token = localStorage.getItem('token')
    
    const response = await fetch(`http://localhost:5000/api/signals/${signalId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) throw new Error('Failed to delete signal')
    
    alert('Signal deleted')
    fetchSignals()
    fetchPendingCount()
  } catch (error) {
    console.error('Error deleting signal:', error)
    alert(error.message || 'Failed to delete signal')
  }
}

// Helper function
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(() => {
  // Get user data
  const userData = localStorage.getItem('user')
  if (userData) {
    user.value = JSON.parse(userData)
  }
  
  // Fetch signals
  fetchSignals()
  fetchPendingCount()
})
</script>
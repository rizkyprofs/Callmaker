<!-- src/views/Dashboard.vue - BUAT FILE BARU -->
<template>
  <div class="dashboard">
    <!-- Header berdasarkan role -->
    <div class="dashboard-header">
      <h1>Welcome, {{ authStore.user?.username }}</h1>
      <div class="user-role-badge" :class="authStore.user?.role">
        {{ authStore.user?.role }}
      </div>
      <button @click="handleLogout" class="logout-btn">Logout</button>
    </div>

    <!-- Admin Notifications -->
    <div v-if="authStore.user?.role === 'admin' && pendingCount > 0" class="admin-alert">
      <div class="alert alert-warning">
        <span>📢 You have {{ pendingCount }} signals waiting for approval</span>
        <button @click="showPending = true" class="btn-sm">Review</button>
      </div>
    </div>

    <!-- Signal Creation Form (Callmaker & Admin) -->
    <div v-if="['callmaker', 'admin'].includes(authStore.user?.role)" class="signal-form-section">
      <div class="card">
        <h3>📈 {{ authStore.user?.role === 'admin' ? 'Publish Signal' : 'Submit Signal' }}</h3>
        <form @submit.prevent="submitSignal" class="signal-form">
          <div class="form-row">
            <input v-model="newSignal.coin_name" placeholder="Coin Name (e.g., BTC/USDT)" required>
            <input v-model="newSignal.entry_price" type="number" step="0.0001" placeholder="Entry Price" required>
          </div>
          <div class="form-row">
            <input v-model="newSignal.target_price" type="number" step="0.0001" placeholder="Target Price" required>
            <input v-model="newSignal.stop_loss" type="number" step="0.0001" placeholder="Stop Loss" required>
          </div>
          <textarea v-model="newSignal.note" placeholder="Analysis note..."></textarea>
          <button type="submit" :disabled="loading" class="btn-primary">
            {{ loading ? 'Submitting...' : (authStore.user?.role === 'admin' ? 'Publish' : 'Submit for Approval') }}
          </button>
        </form>
      </div>
    </div>

    <!-- Signals List -->
    <div class="signals-section">
      <div class="section-header">
        <h2>📊 Trading Signals</h2>
        <div class="filters">
          <select v-model="statusFilter" @change="fetchSignals">
            <option value="all">All</option>
            <option value="pending" v-if="authStore.user?.role !== 'user'">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected" v-if="authStore.user?.role !== 'user'">Rejected</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading">Loading signals...</div>

      <!-- Signals Grid -->
      <div v-else class="signals-grid">
        <div v-for="signal in filteredSignals" :key="signal.id" class="signal-card" :class="signal.status">
          <div class="signal-header">
            <h3>{{ signal.coin_name }}</h3>
            <span class="status-badge" :class="signal.status">
              {{ signal.status }}
            </span>
          </div>
          
          <div class="signal-prices">
            <div class="price-item">
              <span>Entry</span>
              <strong>${{ signal.entry_price }}</strong>
            </div>
            <div class="price-item">
              <span>Target</span>
              <strong class="profit">${{ signal.target_price }}</strong>
            </div>
            <div class="price-item">
              <span>Stop Loss</span>
              <strong class="loss">${{ signal.stop_loss }}</strong>
            </div>
          </div>

          <div v-if="signal.note" class="signal-note">
            <p>{{ signal.note }}</p>
          </div>

          <div class="signal-footer">
            <div class="signal-meta">
              <span>By: {{ signal.creator?.username }}</span>
              <span>{{ formatDate(signal.created_at) }}</span>
            </div>
            
            <!-- Action Buttons -->
            <div v-if="authStore.user?.role === 'admin' && signal.status === 'pending'" class="signal-actions">
              <button @click="updateSignalStatus(signal.id, 'approved')" class="btn-success btn-sm">Approve</button>
              <button @click="updateSignalStatus(signal.id, 'rejected')" class="btn-danger btn-sm">Reject</button>
            </div>
            
            <div v-if="authStore.user?.role === 'admin' || signal.created_by === authStore.user?.id" class="signal-actions">
              <button @click="deleteSignal(signal.id)" class="btn-danger btn-sm">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && signals.length === 0" class="empty-state">
        <p>No signals found</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import axios from 'axios';

const router = useRouter();
const authStore = useAuthStore();
const signals = ref([]);
const loading = ref(false);
const pendingCount = ref(0);
const statusFilter = ref('all');
const newSignal = ref({
  coin_name: '',
  entry_price: '',
  target_price: '',
  stop_loss: '',
  note: ''
});

const filteredSignals = computed(() => {
  if (statusFilter.value === 'all') return signals.value;
  return signals.value.filter(signal => signal.status === statusFilter.value);
});

const fetchSignals = async () => {
  try {
    loading.value = true;
    const response = await axios.get('http://localhost:5000/api/signals', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    signals.value = response.data;
  } catch (error) {
    console.error('Error fetching signals:', error);
    alert('Failed to load signals');
  } finally {
    loading.value = false;
  }
};

const fetchPendingCount = async () => {
  if (authStore.user?.role === 'admin') {
    try {
      const response = await axios.get('http://localhost:5000/api/signals/pending/count', {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      });
      pendingCount.value = response.data.count;
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  }
};

const submitSignal = async () => {
  try {
    loading.value = true;
    const response = await axios.post('http://localhost:5000/api/signals', newSignal.value, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    alert(response.data.message);
    newSignal.value = { coin_name: '', entry_price: '', target_price: '', stop_loss: '', note: '' };
    fetchSignals();
    fetchPendingCount();
  } catch (error) {
    console.error('Error creating signal:', error);
    alert(error.response?.data?.message || 'Failed to create signal');
  } finally {
    loading.value = false;
  }
};

const updateSignalStatus = async (signalId, status) => {
  if (!confirm(`Are you sure you want to ${status} this signal?`)) return;
  
  try {
    await axios.patch(`http://localhost:5000/api/signals/${signalId}/status`, 
      { status },
      {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      }
    );
    
    alert(`Signal ${status}`);
    fetchSignals();
    fetchPendingCount();
  } catch (error) {
    console.error('Error updating signal:', error);
    alert(error.response?.data?.message || 'Failed to update signal');
  }
};

const deleteSignal = async (signalId) => {
  if (!confirm('Are you sure you want to delete this signal?')) return;
  
  try {
    await axios.delete(`http://localhost:5000/api/signals/${signalId}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    alert('Signal deleted');
    fetchSignals();
    fetchPendingCount();
  } catch (error) {
    console.error('Error deleting signal:', error);
    alert(error.response?.data?.message || 'Failed to delete signal');
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  fetchSignals();
  fetchPendingCount();
});
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.user-role-badge {
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.user-role-badge.admin { background: #ff4757; color: white; }
.user-role-badge.callmaker { background: #2ed573; color: white; }
.user-role-badge.user { background: #3742fa; color: white; }

.logout-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
}

.admin-alert {
  margin-bottom: 20px;
}

.alert {
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-warning {
  background: #fff9c4;
  border: 1px solid #ffd600;
}

.signal-form-section {
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.signal-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

input, textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

textarea {
  min-height: 80px;
  resize: vertical;
}

.btn-primary {
  background: #007bff;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-success { background: #28a745; color: white; }
.btn-danger { background: #dc3545; color: white; }
.btn-sm { padding: 5px 10px; font-size: 12px; border: none; border-radius: 3px; cursor: pointer; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.signals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.signal-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-left: 4px solid #ddd;
}

.signal-card.pending { border-left-color: #ffa502; }
.signal-card.approved { border-left-color: #2ed573; }
.signal-card.rejected { border-left-color: #ff4757; }

.signal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.status-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-badge.pending { background: #fff9c4; color: #f39c12; }
.status-badge.approved { background: #d1f7c4; color: #27ae60; }
.status-badge.rejected { background: #ffeaea; color: #e74c3c; }

.signal-prices {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 15px;
}

.price-item {
  text-align: center;
}

.price-item span {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.profit { color: #27ae60; }
.loss { color: #e74c3c; }

.signal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.signal-meta {
  font-size: 12px;
  color: #666;
}

.signal-meta span {
  display: block;
}

.signal-actions {
  display: flex;
  gap: 5px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading {
  text-align: center;
  padding: 40px;
}
</style>
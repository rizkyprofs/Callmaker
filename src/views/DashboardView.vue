<template>
  <div class="dashboard">
    <header class="header">
      <div class="header-left">
        <h1>📊 Dashboard Sinyal</h1>
        <p>Selamat datang, {{ user?.username || 'Pengguna' }}</p>
        <p class="role">Role: <strong>{{ role }}</strong></p>
      </div>
      <div class="header-right">
        <button
          v-if="role === 'admin'"
          @click="$router.push('/admin')"
          class="btn admin"
        >
          🔧 Admin Panel
        </button>
        <button
          v-if="role === 'callmaker'"
          @click="$router.push('/callmaker')"
          class="btn callmaker"
        >
          ➕ Tambah Sinyal
        </button>
        <button class="btn logout" @click="handleLogout">
          🚪 Logout
        </button>
      </div>
    </header>

    <main class="content">
      <div v-if="loading" class="loading">⏳ Memuat data sinyal...</div>

      <div v-else-if="signals.length === 0" class="empty">
        Tidak ada sinyal yang tersedia.
      </div>

      <div v-else class="signal-grid">
        <div
          v-for="signal in signals"
          :key="signal.id"
          class="signal-card"
        >
          <div class="card-header">
            <h2>{{ signal.title }}</h2>
            <span class="pair">{{ signal.pair }}</span>
          </div>

          <div class="card-body">
            <p><strong>Entry:</strong> {{ signal.entry }}</p>
            <p><strong>Take Profit:</strong> {{ signal.takeProfit }}</p>
            <p><strong>Stop Loss:</strong> {{ signal.stopLoss }}</p>
            <p>
              <strong>Status:</strong>
              <span
                :class="{
                  approved: signal.status === 'approved' || signal.status === 'ACC',
                  pending: signal.status === 'pending',
                  rejected: signal.status === 'rejected'
                }"
              >
                {{ signal.status }}
              </span>
            </p>
          </div>

          <!-- 👇 Tombol khusus admin -->
          <div v-if="role === 'admin'" class="card-actions">
            <button
              v-if="signal.status === 'pending'"
              @click="approveSignal(signal.id)"
              class="btn approve"
            >
              ✅ ACC
            </button>
            <button
              @click="deleteSignal(signal.id)"
              class="btn delete"
            >
              🗑 Hapus
            </button>
          </div>

          <footer class="card-footer">
            <small>📅 {{ new Date(signal.createdAt).toLocaleString() }}</small>
          </footer>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useAuthStore } from "../stores/auth"; // ✅ ganti ini
import { useRouter } from "vue-router";

const router = useRouter();
const auth = useAuthStore(); // ✅ panggil store
const loading = ref(true);
const signals = ref([]);

// gunakan reactive dari store
const user = auth.user;
const role = auth.role;

const handleLogout = () => {
  auth.logout();
  router.push("/login");
};

// 🔄 Ambil data sinyal
const fetchSignals = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/signals", {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (role.value === "admin") {
      signals.value = res.data;
    } else if (role.value === "callmaker") {
      signals.value = res.data.filter(
        (s) => s.callmaker === user.value.username
      );
    } else {
      signals.value = res.data.filter(
        (s) => s.status === "approved" || s.status === "ACC"
      );
    }
  } catch (err) {
    console.error("Gagal memuat sinyal:", err);
  } finally {
    loading.value = false;
  }
};

// ✅ Admin Approve sinyal
const approveSignal = async (id) => {
  if (!confirm("Setujui sinyal ini?")) return;
  try {
    await axios.patch(
      `http://localhost:5000/api/signals/${id}/approve`,
      {},
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    );
    fetchSignals();
  } catch (err) {
    console.error("Gagal ACC sinyal:", err);
  }
};

// 🗑 Admin Hapus sinyal
const deleteSignal = async (id) => {
  if (!confirm("Hapus sinyal ini?")) return;
  try {
    await axios.delete(`http://localhost:5000/api/signals/${id}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    fetchSignals();
  } catch (err) {
    console.error("Gagal menghapus sinyal:", err);
  }
};

onMounted(fetchSignals);
</script>


<style scoped>
/* Gaya asli kamu tetap dipertahankan */
.dashboard {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f0f2f5;
  color: #333;
  width: 100%;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 20px 40px;
  border-bottom: 2px solid #e6e6e6;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.05);
}

.header-left h1 {
  margin: 0;
  font-size: 26px;
}

.header-left p {
  margin: 2px 0;
  color: #666;
}

.role strong {
  color: #222;
}

.header-right {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn.admin {
  background: #d9534f;
  color: #fff;
}
.btn.admin:hover {
  background: #b52b27;
}

.btn.callmaker {
  background: #007bff;
  color: #fff;
}
.btn.callmaker:hover {
  background: #0056b3;
}

.btn.logout {
  background: #6c757d;
  color: #fff;
}
.btn.logout:hover {
  background: #5a6268;
}

.content {
  flex: 1;
  padding: 30px 50px;
  overflow-y: auto;
}

.loading,
.empty {
  text-align: center;
  margin-top: 100px;
  font-size: 18px;
  color: #888;
}

.signal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

.signal-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.signal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 14px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.pair {
  font-size: 14px;
  background: #eef3f8;
  padding: 4px 10px;
  border-radius: 5px;
  color: #007bff;
}

.card-body {
  margin-top: 10px;
  line-height: 1.6;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.btn.approve {
  background: #28a745;
  color: #fff;
}
.btn.approve:hover {
  background: #218838;
}

.btn.delete {
  background: #dc3545;
  color: #fff;
}
.btn.delete:hover {
  background: #b52b27;
}

.card-footer {
  border-top: 1px solid #eee;
  margin-top: 10px;
  padding-top: 8px;
  font-size: 13px;
  color: #777;
}

.approved {
  color: #28a745;
}
.pending {
  color: #ffc107;
}
.rejected {
  color: #dc3545;
}
</style>

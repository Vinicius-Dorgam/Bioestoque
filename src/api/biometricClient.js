// Simple standalone biometric API client
// This replaces Base44 entities with local storage or API calls

const API_BASE_URL = 'http://localhost:3001/api'; // You can change this to your actual API

class BiometricAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Biometric Profile methods
  async createProfile(data) {
    return this.request('/biometric-profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfiles(sortOrder = '-created_date') {
    return this.request(`/biometric-profiles?sort=${sortOrder}`);
  }

  async updateProfile(id, data) {
    return this.request(`/biometric-profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProfile(id) {
    return this.request(`/biometric-profiles/${id}`, {
      method: 'DELETE',
    });
  }

  // Materials methods
  async createMaterial(data) {
    return this.request('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMaterials() {
    return this.request('/materials');
  }

  async updateMaterial(id, data) {
    return this.request(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMaterial(id) {
    return this.request(`/materials/${id}`, {
      method: 'DELETE',
    });
  }

  // Checkout methods
  async createCheckout(data) {
    return this.request('/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCheckouts() {
    return this.request('/checkout');
  }

  async updateCheckout(id, data) {
    return this.request(`/checkout/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Dashboard data
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getMovimentacoesRecentes() {
    return this.request('/dashboard/movimentacoes');
  }
}

// Mock implementation using localStorage for demo purposes
class MockBiometricAPI {
  constructor() {
    this.storageKey = 'bioestoque_data';
    this.initializeData();
  }

  initializeData() {
    if (!localStorage.getItem(this.storageKey)) {
      const initialData = {
        biometricProfiles: [],
        materials: [],
        checkouts: [],
      };
      localStorage.setItem(this.storageKey, JSON.stringify(initialData));
    }
  }

  getData() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : { biometricProfiles: [], materials: [], checkouts: [] };
  }

  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async createProfile(data) {
    const dbData = this.getData();
    const newProfile = {
      id: this.generateId(),
      ...data,
      created_date: new Date().toISOString(),
    };
    dbData.biometricProfiles.push(newProfile);
    this.saveData(dbData);
    return newProfile;
  }

  async getProfiles(sortOrder = '-created_date') {
    const dbData = this.getData();
    let profiles = [...dbData.biometricProfiles];
    
    if (sortOrder === '-created_date') {
      profiles.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sortOrder === 'created_date') {
      profiles.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    }
    
    return profiles;
  }

  async updateProfile(id, data) {
    const dbData = this.getData();
    const index = dbData.biometricProfiles.findIndex(p => p.id === id);
    if (index !== -1) {
      dbData.biometricProfiles[index] = { ...dbData.biometricProfiles[index], ...data };
      this.saveData(dbData);
      return dbData.biometricProfiles[index];
    }
    throw new Error('Profile not found');
  }

  async deleteProfile(id) {
    const dbData = this.getData();
    dbData.biometricProfiles = dbData.biometricProfiles.filter(p => p.id !== id);
    this.saveData(dbData);
    return { success: true };
  }

  async createMaterial(data) {
    const dbData = this.getData();
    const newMaterial = {
      id: this.generateId(),
      ...data,
      created_date: new Date().toISOString(),
    };
    dbData.materials.push(newMaterial);
    this.saveData(dbData);
    return newMaterial;
  }

  async getMaterials() {
    const dbData = this.getData();
    return dbData.materials;
  }

  async updateMaterial(id, data) {
    const dbData = this.getData();
    const index = dbData.materials.findIndex(m => m.id === id);
    if (index !== -1) {
      dbData.materials[index] = { ...dbData.materials[index], ...data };
      this.saveData(dbData);
      return dbData.materials[index];
    }
    throw new Error('Material not found');
  }

  async deleteMaterial(id) {
    const dbData = this.getData();
    dbData.materials = dbData.materials.filter(m => m.id !== id);
    this.saveData(dbData);
    return { success: true };
  }

  async createCheckout(data) {
    const dbData = this.getData();
    const newCheckout = {
      id: this.generateId(),
      ...data,
      created_date: new Date().toISOString(),
    };
    dbData.checkouts.push(newCheckout);
    this.saveData(dbData);
    return newCheckout;
  }

  async getCheckouts() {
    const dbData = this.getData();
    return dbData.checkouts;
  }

  async updateCheckout(id, data) {
    const dbData = this.getData();
    const index = dbData.checkouts.findIndex(c => c.id === id);
    if (index !== -1) {
      dbData.checkouts[index] = { ...dbData.checkouts[index], ...data };
      this.saveData(dbData);
      return dbData.checkouts[index];
    }
    throw new Error('Checkout not found');
  }

  async getDashboardStats() {
    const dbData = this.getData();
    return {
      totalMaterials: dbData.materials.length,
      activeProfiles: dbData.biometricProfiles.filter(p => p.active).length,
      recentCheckouts: dbData.checkouts.filter(c => 
        new Date(c.created_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
    };
  }

  async getMovimentacoesRecentes() {
    const dbData = this.getData();
    return dbData.checkouts
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 10);
  }
}

// Use mock API for development, switch to real API when backend is ready
export const biometricAPI = new MockBiometricAPI();

// Export the mock API as entities to match Base44 structure
export const entities = {
  BiometricProfile: {
    create: (data) => biometricAPI.createProfile(data),
    list: (sortOrder) => biometricAPI.getProfiles(sortOrder),
    update: (id, data) => biometricAPI.updateProfile(id, data),
    delete: (id) => biometricAPI.deleteProfile(id),
  },
  Material: {
    create: (data) => biometricAPI.createMaterial(data),
    list: () => biometricAPI.getMaterials(),
    update: (id, data) => biometricAPI.updateMaterial(id, data),
    delete: (id) => biometricAPI.deleteMaterial(id),
  },
  Checkout: {
    create: (data) => biometricAPI.createCheckout(data),
    list: () => biometricAPI.getCheckouts(),
    update: (id, data) => biometricAPI.updateCheckout(id, data),
  },
};

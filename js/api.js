// js/api.js

/**
 * API Module
 * Handles all backend API calls (Listmonk, booking, etc.)
 */

const API = {
  // API Configuration
  config: {
    baseURL: '/api', // Change to your actual API endpoint
    listmonkURL: 'https://your-listmonk-server.com/api',
    timeout: 10000,
  },

  /**
   * Initialize API
   */
  init() {
    console.log('✅ API module initialized');
  },

  /**
   * Subscribe email to Listmonk
   */
  async subscribeEmail(email) {
    try {
      const response = await this.post('/subscribe', {
        email: email,
        list_ids: [1], // Your Listmonk list ID
        name: '',
        status: 'enabled',
        preconfirm_subscriptions: false,
      });

      return response;
    } catch (error) {
      console.error('Email subscription error:', error);
      throw error;
    }
  },

  /**
   * Submit contact/booking form
   */
  async submitContactForm(data) {
    try {
      const response = await this.post('/contact', {
        name: data.name,
        email: data.email,
        subject: data.subject || 'General Inquiry',
        message: data.message,
        type: data.type || 'general', // 'general', 'booking', 'press'
      });

      return response;
    } catch (error) {
      console.error('Contact form error:', error);
      throw error;
    }
  },

  /**
   * Get tour dates
   */
  async getTourDates() {
    try {
      const response = await this.get('/tour-dates');
      return response.dates || [];
    } catch (error) {
      console.error('Error fetching tour dates:', error);
      return [];
    }
  },

  /**
   * Get latest music/releases
   */
  async getLatestMusic() {
    try {
      const response = await this.get('/music/latest');
      return response.tracks || [];
    } catch (error) {
      console.error('Error fetching music:', error);
      return [];
    }
  },

  /**
   * Submit booking request
   */
  async submitBookingRequest(data) {
    try {
      const response = await this.post('/booking', {
        venue_name: data.venueName,
        contact_name: data.contactName,
        email: data.email,
        phone: data.phone,
        event_date: data.eventDate,
        event_type: data.eventType,
        budget: data.budget,
        details: data.details,
      });

      return response;
    } catch (error) {
      console.error('Booking request error:', error);
      throw error;
    }
  },

  /**
   * Generic GET request
   */
  async get(endpoint) {
    const url = `${this.config.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`GET ${url} failed:`, error);
      throw error;
    }
  },

  /**
   * Generic POST request
   */
  async post(endpoint, data) {
    const url = `${this.config.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`POST ${url} failed:`, error);
      throw error;
    }
  },

  /**
   * Generic PUT request
   */
  async put(endpoint, data) {
    const url = `${this.config.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`PUT ${url} failed:`, error);
      throw error;
    }
  },

  /**
   * Generic DELETE request
   */
  async delete(endpoint) {
    const url = `${this.config.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`DELETE ${url} failed:`, error);
      throw error;
    }
  },

  /**
   * Upload file
   */
  async uploadFile(endpoint, file, additionalData = {}) {
    const url = `${this.config.baseURL}${endpoint}`;
    const formData = new FormData();

    formData.append('file', file);

    // Add any additional data
    Object.keys(additionalData).forEach((key) => {
      formData.append(key, additionalData[key]);
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`File upload to ${url} failed:`, error);
      throw error;
    }
  },

  /**
   * Check API health
   */
  async healthCheck() {
    try {
      const response = await this.get('/health');
      return response.status === 'ok';
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  },
};

// Auto-initialize if not using module system
if (typeof module === 'undefined') {
  API.init();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}

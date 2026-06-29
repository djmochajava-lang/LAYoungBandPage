// js/forms.js

/**
 * Forms Module
 * Handles email signup, contact forms, and validation
 * Persists submissions to Firestore (contact_submissions collection)
 */

const Forms = {
  FALLBACK_EMAIL: 'booking@layoungbandpage.com',

  /**
   * Get Firestore instance (initialize Firebase if needed)
   */
  _getDb() {
    // DARK: contact_submissions writes go to Supabase via the shared adapter.
    if (window.LA_AUTH_SOURCE === 'supabase') {
      return (window.LAAuth && window.LAAuth.available()) ? window.LAAuth.db() : null;
    }
    if (typeof firebase === 'undefined') return null;
    try {
      if (!firebase.apps.length) {
        const config = (typeof window.SITE_CONFIG !== 'undefined') ? window.SITE_CONFIG.firebase : null;
        if (!config) return null;
        firebase.initializeApp(config);
      }
      return firebase.firestore();
    } catch (e) {
      return null;
    }
  },

  // Provider-agnostic "now": Firestore sentinel on Firebase, ISO on Supabase.
  _serverTs() {
    if (window.LA_AUTH_SOURCE !== 'supabase' && typeof firebase !== 'undefined' &&
        firebase.firestore && firebase.firestore.FieldValue) {
      return firebase.firestore.FieldValue.serverTimestamp();
    }
    return new Date().toISOString();
  },

  /**
   * Initialize all forms
   */
  init() {
    this.initEmailSignup();
    this.initContactForm();
    console.log('✅ Forms initialized');
  },

  /**
   * Email signup form handler
   */
  initEmailSignup() {
    const signupForm = document.getElementById('signup-form');

    if (!signupForm) return;

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = signupForm.querySelector('input[type="email"]');
      const submitBtn = signupForm.querySelector('.submit-btn');
      const email = emailInput.value.trim();

      // Validation
      if (!this.isValidEmail(email)) {
        this.showMessage(
          signupForm,
          'Please enter a valid email address',
          'error',
        );
        return;
      }

      // Firestore availability guard
      const db = this._getDb();
      if (!db) {
        this.showMessage(
          signupForm,
          'Unable to subscribe \u2014 please try again later or email us at ' + this.FALLBACK_EMAIL,
          'error',
        );
        return;
      }

      // Disable button during submission
      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Subscribing...';

      try {
        // Persist to Firestore
        await db.collection('contact_submissions').add({
          formType: 'email-signup',
          source: 'la-young',
          email: email,
          submittedAt: this._serverTs()
        });

        this.showMessage(
          signupForm,
          'Thanks for subscribing! You\u2019re part of the Soul Fam now.',
          'success',
        );
        emailInput.value = '';

        // Fan Points
        if (typeof FanPoints !== 'undefined') FanPoints.award('activity:email-signup', 20, 'Joined the Fam');

        // Track conversion
        if (typeof Analytics !== 'undefined') {
          Analytics.trackEvent('Email Signup', 'Submit', 'Newsletter');
        }
      } catch (error) {
        console.error('Signup error:', error);
        this.showMessage(
          signupForm,
          'Unable to subscribe \u2014 please try again or email us at ' + this.FALLBACK_EMAIL,
          'error',
        );
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  },

  /**
   * Contact/booking form handler
   */
  initContactForm() {
    const contactForm = document.getElementById('contact-form');

    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());

      // Validation
      const errors = this.validateContactForm(data);
      if (errors.length > 0) {
        this.showMessage(contactForm, errors.join('<br>'), 'error');
        return;
      }

      // Firestore availability guard
      const db = this._getDb();
      if (!db) {
        this.showMessage(
          contactForm,
          'Unable to send \u2014 please try again later or email us at ' + this.FALLBACK_EMAIL,
          'error',
        );
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';

      try {
        // Persist to Firestore
        await db.collection('contact_submissions').add({
          formType: 'contact',
          source: 'la-young',
          name: data.name.trim(),
          email: data.email.trim(),
          subject: (data.subject || '').trim(),
          message: data.message.trim(),
          submittedAt: this._serverTs()
        });

        this.showMessage(
          contactForm,
          "Message sent! We\u2019ll get back to you within 24\u201348 hours.",
          'success',
        );
        contactForm.reset();

        // Fan Points
        if (typeof FanPoints !== 'undefined') FanPoints.award('activity:contact-form', 20, 'Sent a Message');

        if (typeof Analytics !== 'undefined') {
          Analytics.trackEvent(
            'Contact Form',
            'Submit',
            data.subject || 'General',
          );
        }
      } catch (error) {
        console.error('Contact form error:', error);
        this.showMessage(
          contactForm,
          'Unable to send \u2014 please try again or email us at ' + this.FALLBACK_EMAIL,
          'error',
        );
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  },

  /**
   * Email validation
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Validate contact form
   */
  validateContactForm(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Please enter your name');
    }

    if (!this.isValidEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!data.message || data.message.trim().length < 10) {
      errors.push('Please enter a message (at least 10 characters)');
    }

    return errors;
  },

  /**
   * Show message to user
   */
  showMessage(form, message, type = 'info') {
    // Remove existing messages
    const existingMsg = form.querySelector('.form-message');
    if (existingMsg) existingMsg.remove();

    const messageEl = document.createElement('div');
    messageEl.className = `form-message form-message-${type}`;
    messageEl.innerHTML = message;
    messageEl.style.cssText = `
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 4px;
      text-align: center;
      font-size: 0.95rem;
      animation: fadeInUp 0.3s ease-out;
      background: ${type === 'success' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'};
      color: ${type === 'success' ? '#4caf50' : '#f44336'};
      border: 1px solid ${type === 'success' ? '#4caf50' : '#f44336'};
    `;

    form.appendChild(messageEl);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      messageEl.style.opacity = '0';
      setTimeout(() => messageEl.remove(), 300);
    }, 5000);
  },

  /**
   * Add real-time validation to input
   */
  addLiveValidation(input, validationFn) {
    input.addEventListener('blur', () => {
      const isValid = validationFn(input.value);
      input.classList.toggle('invalid', !isValid);
      input.classList.toggle('valid', isValid);
    });
  },
};

// Auto-initialize if not using module system
if (typeof module === 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Forms.init());
  } else {
    Forms.init();
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Forms;
}

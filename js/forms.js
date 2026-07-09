// js/forms.js

/**
 * Forms Module
 * Handles email signup, contact forms, and validation
 * Persists submissions to Supabase (contact_submissions cache table).
 *
 * fbexit S6 (2026-07-09): the Firestore write path is RETIRED. Firebase
 * membership has ended (D-NO-FIREBASE) and Firestore returns 403; the prior
 * DARK adapter path also required the supabase-js UMD to be loaded on the page
 * (it is not, on the contact page) so BOTH forms were failing live. This module
 * now writes directly to the Supabase REST endpoint — the same proven pattern
 * as EPK/layoungepk.html and the GBE main-site forms.js strategy 2: INSERT-only,
 * anon key (public by design, RLS-gated), no SDK/UMD, no auth, no read-back.
 * Snake_case columns match the SoR pull (server supabase-pull.js) + intake
 * normalizer; the full payload is archived in raw_doc. Lands end-to-end:
 * Supabase contact_submissions -> supabase-pull -> firebase_inbox -> normalizer
 * -> booking_inbox (System of Record).
 */

const Forms = {
  FALLBACK_EMAIL: 'booking@layoungbandpage.com',

  /**
   * Supabase config from SITE_CONFIG. The anon (publishable) key is client-safe
   * by design — every table is RLS-gated and contact_submissions is INSERT-only
   * for anonymous visitors. Returns null if config is absent.
   */
  _sbConfig() {
    const c = (typeof window !== 'undefined' && window.SITE_CONFIG) ? window.SITE_CONFIG.supabase : null;
    return (c && c.url && c.anonKey) ? c : null;
  },

  /**
   * INSERT a row into the Supabase contact_submissions cache via REST.
   * Prefer: return=minimal — anon has INSERT-only (no SELECT), so no read-back.
   * @returns {Promise<{ok:boolean}>}
   */
  _postContactSubmission(row) {
    const cfg = this._sbConfig();
    if (!cfg) return Promise.reject(new Error('Supabase config missing'));
    return fetch(cfg.url + '/rest/v1/contact_submissions', {
      method: 'POST',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': 'Bearer ' + cfg.anonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(row)
    }).then(function (res) {
      if (!res.ok) throw new Error('Supabase returned ' + res.status);
      return { ok: true };
    });
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

      // Supabase config guard
      if (!this._sbConfig()) {
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
        // Persist to Supabase contact_submissions (INSERT-only, snake_case cols)
        const iso = new Date().toISOString();
        await this._postContactSubmission({
          id: 'cs_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10),
          form_type: 'email-signup',
          source: 'la-young',
          email: email,
          submitted_at: iso,
          raw_doc: { formType: 'email-signup', source: 'la-young', email: email, submittedAt: iso }
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

      // Supabase config guard
      if (!this._sbConfig()) {
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
        // Persist to Supabase contact_submissions (INSERT-only, snake_case cols)
        const iso = new Date().toISOString();
        const name = data.name.trim();
        const email = data.email.trim();
        const subject = (data.subject || '').trim();
        const message = data.message.trim();
        await this._postContactSubmission({
          id: 'cs_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10),
          form_type: 'contact',
          source: 'la-young',
          name: name,
          email: email,
          subject: subject,
          message: message,
          submitted_at: iso,
          raw_doc: { formType: 'contact', source: 'la-young', name: name, email: email, subject: subject, message: message, submittedAt: iso }
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

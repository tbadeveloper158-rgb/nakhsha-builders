/* Session-preserving consultation form integration. No automatic enquiry/OTP sends.
   setupNakhshaContact(form) progressively enables the companion server.py bridge.
   A static host offers an explicitly labeled email draft/official-form alternative. */
(() => {
  'use strict';
  window.setupNakhshaContact = function setupNakhshaContact(form) {
    if (!form || form.dataset.contactReady === 'true') return;
    form.dataset.contactReady = 'true';
    const status = form.querySelector('[data-contact-status]') || form.appendChild(document.createElement('p'));
    status.dataset.contactStatus = '';
    status.classList.add('contact-status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('role', 'status');
    const mount = form.querySelector('[data-contact-verification]') || form.appendChild(document.createElement('div'));
    mount.dataset.contactVerification = '';
    mount.classList.add('contact-verification');
    const fallback = form.querySelector('[data-contact-fallback]') || form.appendChild(document.createElement('div'));
    fallback.dataset.contactFallback = '';
    fallback.classList.add('contact-fallback');
    fallback.hidden = true;
    const submit = form.querySelector('button[type="submit"]');
    if (!submit) return;
    const originalSubmit = submit.innerHTML;
    const field = name => form.elements.namedItem(name);
    const mobile = field('mobile');
    if (!mobile) return;
    mobile.autocomplete = 'tel';
    mobile.inputMode = 'tel';
    mobile.maxLength = 16;
    let mode = 'idle', bootstrapPromise = null, verifiedPhone = '', cooldown = 0, timer = null;
    let pending = false, processed = false, uncertain = false;
    const phoneDigits = value => {
      let digits = String(value || '').replace(/\D/g, '');
      if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
      return digits;
    };
    const phoneValid = () => /^[6-9]\d{9}$/.test(phoneDigits(mobile.value));
    const consent = () => !!field('consent')?.checked;
    const human = () => !!field('human_confirm')?.checked;
    function say(message, error = false) {
      status.textContent = message;
      status.dataset.state = error ? 'error' : 'info';
      status.setAttribute('role', error ? 'alert' : 'status');
    }
    function node(tag, className, text) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text) element.textContent = text;
      return element;
    }
    const verificationTitle = node('strong', 'verification-title', 'A quick verification. A considered conversation.');
    const verificationNote = node('p', 'verification-note', 'Your WhatsApp verification code is sent only when you request it.');
    const actions = node('div', 'verification-actions');
    const send = node('button', 'verification-send', 'Send WhatsApp code');
    send.type = 'button';
    const change = node('button', 'verification-change', 'Change number');
    change.type = 'button';
    change.hidden = true;
    actions.append(send, change);
    const codeRow = node('div', 'otp-code-row');
    codeRow.hidden = true;
    const codeLabel = node('label', 'otp-label', 'Verification code');
    const code = document.createElement('input');
    code.type = 'text';
    code.inputMode = 'numeric';
    code.autocomplete = 'one-time-code';
    code.maxLength = 6;
    code.placeholder = '6-digit WhatsApp code';
    code.setAttribute('aria-label', 'WhatsApp verification code');
    codeLabel.append(code);
    const verify = node('button', 'verification-verify', 'Verify number');
    verify.type = 'button';
    codeRow.append(codeLabel, verify);
    mount.append(verificationTitle, verificationNote, actions, codeRow);
    if (!field('human_confirm')) {
      const humanLabel = node('label', 'contact-human');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'human_confirm';
      checkbox.required = true;
      humanLabel.append(checkbox, document.createTextNode('I am not a robot.'));
      mount.append(humanLabel);
    }
    const official = node('a', 'contact-official', 'Use Nakhsha’s verified online form ↗');
    official.href = 'https://nakhsha.in/contact#contactConstructionForm';
    official.target = '_blank';
    official.rel = 'noopener noreferrer';
    const call = node('a', 'contact-call', 'Or call +91 96069 66266');
    call.href = 'tel:+919606966266';
    fallback.append(official, call);
    const apiBase = form.dataset.contactApi || '/api/consultation';
    function buttons() {
      send.disabled = pending || mode !== 'verified' || !!verifiedPhone || cooldown > 0 || processed || uncertain;
      verify.disabled = pending || mode !== 'verified' || processed || uncertain;
      submit.disabled = pending || processed || uncertain;
      form.setAttribute('aria-busy', pending ? 'true' : 'false');
      if (verifiedPhone) send.textContent = 'Number verified';
      else if (cooldown > 0) send.textContent = 'Resend in ' + cooldown + 's';
      else send.textContent = codeRow.hidden ? 'Send WhatsApp code' : 'Resend WhatsApp code';
    }
    function countdown(seconds) {
      clearInterval(timer);
      cooldown = Math.max(1, Math.min(600, Number(seconds) || 30));
      buttons();
      timer = setInterval(() => {
        cooldown -= 1;
        if (cooldown <= 0) clearInterval(timer);
        buttons();
      }, 1000);
    }
    async function requestJSON(path, body) {
      const response = await fetch(apiBase + path, {
        method: body === undefined ? 'GET' : 'POST',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) throw new Error('The online verification service is not available on this host.');
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        const failure = new Error(result.message || 'The consultation service could not complete this step.');
        failure.code = result.code;
        failure.retryAfter = result.retry_after;
        throw failure;
      }
      return result;
    }
    function staticMode() {
      mode = 'email';
      mount.hidden = true;
      fallback.hidden = false;
      submit.textContent = 'Prepare email enquiry';
      const humanField = field('human_confirm');
      if (humanField) humanField.required = false;
      say('You can send these details through your email app. Review the prepared draft before sending, or use Nakhsha’s verified online form.');
      buttons();
    }
    function bootstrap() {
      if (bootstrapPromise) return bootstrapPromise;
      if (!['http:', 'https:'].includes(location.protocol) || form.dataset.contactMode === 'email') {
        staticMode();
        return Promise.resolve(false);
      }
      mode = 'loading';
      verificationNote.textContent = 'Preparing secure WhatsApp verification…';
      buttons();
      bootstrapPromise = requestJSON('/bootstrap').then(() => {
        mode = 'verified';
        verificationNote.textContent = 'We’ll send a verification code on WhatsApp when you request it. No enquiry is submitted at this step.';
        buttons();
        return true;
      }).catch(() => {
        staticMode();
        return false;
      });
      return bootstrapPromise;
    }
    const gate = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        gate.disconnect();
        bootstrap();
      }
    }, { rootMargin: '150px', threshold: 0.01 }) : null;
    gate?.observe(form);
    form.addEventListener('focusin', bootstrap, { once: true });
    function verifyConsent() {
      if (!consent()) {
        say('Please agree to be contacted about your enquiry before requesting a WhatsApp code.', true);
        field('consent')?.focus();
        return false;
      }
      if (!phoneValid()) {
        mobile.setCustomValidity('Enter a valid 10-digit Indian mobile number.');
        mobile.reportValidity();
        say('Please enter a valid mobile number before requesting a code.', true);
        return false;
      }
      mobile.setCustomValidity('');
      return true;
    }
    async function sendCode() {
      await bootstrap();
      if (mode !== 'verified' || !verifyConsent()) return;
      pending = true;
      buttons();
      say('Requesting your WhatsApp verification code…');
      try {
        const result = await requestJSON('/otp/send', { mobile: mobile.value.trim(), consent: true });
        codeRow.hidden = false;
        countdown(result.retry_after || 30);
        say('Code sent on WhatsApp. Enter it below to verify your mobile number.');
        code.focus();
      } catch (error) {
        say(error.message, true);
        if (error.retryAfter) countdown(error.retryAfter);
        fallback.hidden = false;
      } finally {
        pending = false;
        buttons();
      }
    }
    send.addEventListener('click', sendCode);
    verify.addEventListener('click', async () => {
      if (!verifyConsent()) return;
      if (!/^\d{4,6}$/.test(code.value.trim())) {
        say('Enter the verification code you received on WhatsApp.', true);
        code.focus();
        return;
      }
      pending = true;
      buttons();
      say('Verifying your mobile number…');
      try {
        await requestJSON('/otp/verify', { mobile: mobile.value.trim(), otp: code.value.trim(), consent: true });
        verifiedPhone = phoneDigits(mobile.value);
        mobile.readOnly = true;
        codeRow.hidden = true;
        change.hidden = false;
        verificationNote.textContent = 'Mobile number verified. You can now request a consultation.';
        say('Your number is verified. Review your details and submit when you’re ready.');
      } catch (error) {
        say(error.message, true);
      } finally {
        pending = false;
        buttons();
      }
    });
    function resetPhone() {
      verifiedPhone = '';
      mobile.readOnly = false;
      change.hidden = true;
      code.value = '';
      codeRow.hidden = true;
      verificationNote.textContent = 'Verify your new mobile number before requesting a consultation.';
      buttons();
    }
    change.addEventListener('click', () => { resetPhone(); mobile.focus(); });
    mobile.addEventListener('input', () => {
      mobile.setCustomValidity('');
      if (verifiedPhone && phoneDigits(mobile.value) !== verifiedPhone) resetPhone();
    });
    function values() {
      const data = {};
      for (const name of ['name', 'mobile', 'email', 'location', 'project_type', 'budget', 'message', 'website']) {
        data[name] = String(field(name)?.value || '').trim();
      }
      data.consent = consent();
      data.human_confirm = human();
      return data;
    }
    function prepareEmail(data) {
      const body = ['Hello Nakhsha Builders,', '', 'I would like to discuss a commercial construction project.', '',
        'Name: ' + data.name, 'Phone: ' + data.mobile, 'Email: ' + data.email,
        'Location: ' + data.location, 'Project type: ' + data.project_type,
        'Budget: ' + data.budget, '', data.message, '', 'I agree to be contacted about this enquiry.'].join('\n');
      const url = 'mailto:eo@nakhsha.in?subject=' + encodeURIComponent('Commercial project consultation — ' + data.name) + '&body=' + encodeURIComponent(body);
      const emailLink = fallback.querySelector('[data-prepared-email]') || node('a', 'contact-email', 'Open prepared email draft ↗');
      emailLink.dataset.preparedEmail = '';
      emailLink.href = url;
      if (!emailLink.parentNode) fallback.prepend(emailLink);
      fallback.hidden = false;
      say('Your email draft is ready. Review and send it in your email app. This website has not sent your enquiry.');
      emailLink.click();
    }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending || processed || uncertain) return;
      await bootstrap();
      if (!phoneValid()) mobile.setCustomValidity('Enter a valid 10-digit Indian mobile number.');
      else mobile.setCustomValidity('');
      if (!form.reportValidity()) {
        say('Please complete the required details before continuing.', true);
        return;
      }
      const data = values();
      if (!data.consent) {
        say('Please agree to be contacted about this enquiry.', true);
        field('consent')?.focus();
        return;
      }
      if (mode === 'email') {
        prepareEmail(data);
        return;
      }
      if (verifiedPhone !== phoneDigits(data.mobile)) {
        say('Verify your mobile number using the WhatsApp code before submitting.', true);
        send.focus();
        return;
      }
      if (!data.human_confirm) {
        say('Please confirm that you are not a robot.', true);
        field('human_confirm')?.focus();
        return;
      }
      pending = true;
      submit.textContent = 'Submitting your enquiry…';
      buttons();
      try {
        const response = await requestJSON('/submit', data);
        if (response.delivered !== true) throw new Error('Delivery has not been confirmed. Please contact Nakhsha directly.');
        processed = true;
        submit.textContent = 'Consultation requested';
        say(response.message || 'Your consultation request was accepted by Nakhsha.');
        form.dataset.contactState = 'submitted';
      } catch (error) {
        uncertain = error.code === 'delivery_unknown' || !error.code;
        say(uncertain ? 'We could not confirm delivery. Please contact Nakhsha before submitting again.' : error.message, true);
        if (uncertain) submit.textContent = 'Please contact the team';
        else submit.innerHTML = originalSubmit;
        fallback.hidden = false;
      } finally {
        pending = false;
        buttons();
      }
    });
    buttons();
    return { bootstrap, get mode() { return mode; } };
  };
})();

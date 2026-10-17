import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signupErrorMessage } from '../lib/auth-errors.ts';

test('signup errors distinguish delivery restrictions, quotas, validation and service failures', () => {
  assert.match(signupErrorMessage({ code: 'email_address_not_authorized', status: 403 }), /mengaktifkan layanan email/);
  assert.match(signupErrorMessage({ code: 'over_email_send_rate_limit', status: 429 }), /Batas pengiriman email/);
  assert.match(signupErrorMessage({ code: 'weak_password', status: 422 }), /kata sandi yang lebih kuat/);
  assert.match(signupErrorMessage({ code: 'signup_disabled' }), /Pendaftaran akun baru sedang tidak tersedia/);
  assert.match(signupErrorMessage({ code: 'email_exists' }), /Lupa kata sandi/);
  assert.match(signupErrorMessage({ code: 'unexpected_failure', status: 500 }), /unexpected_failure \(500\)/);
  assert.match(signupErrorMessage({ name: 'AuthRetryableFetchError' }), /Periksa koneksi/);
  assert.match(signupErrorMessage({ name: 'AuthRetryableFetchError', status: 500 }), /signup_failed \(500\)/);
  assert.match(signupErrorMessage({ status: 429 }), /Tunggu/);
  assert.equal(signupErrorMessage({ code: 'user@example.com/token?secret' }).includes('user@example.com'), false);
});

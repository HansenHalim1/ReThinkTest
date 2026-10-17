type AuthFailure = { code?: string; status?: number; name?: string };

export function signupErrorMessage(error: AuthFailure): string {
  switch (error.code) {
    case 'email_address_not_authorized':
      return 'Email konfirmasi belum bisa dikirim ke alamat ini. Hubungi pengelola untuk mengaktifkan layanan email. (email_address_not_authorized)';
    case 'over_email_send_rate_limit':
      return 'Batas pengiriman email konfirmasi tercapai. Tunggu sebelum mencoba lagi. (over_email_send_rate_limit)';
    case 'over_request_rate_limit':
      return 'Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi. (over_request_rate_limit)';
    case 'weak_password':
      return 'Kata sandi belum memenuhi persyaratan keamanan. Gunakan kata sandi yang lebih kuat. (weak_password)';
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Periksa alamat email dan isian pendaftaranmu. Gunakan alamat email yang aktif.';
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'Pendaftaran akun baru sedang tidak tersedia. Hubungi pengelola. (' + error.code + ')';
    case 'user_already_exists':
    case 'email_exists':
      return 'Email ini sudah terdaftar. Coba masuk atau gunakan Lupa kata sandi.';
    case 'captcha_failed':
      return 'Pemeriksaan keamanan belum berhasil. Muat ulang halaman dan coba lagi. (captcha_failed)';
  }
  if (error.status === 429) return 'Terlalu banyak percobaan atau pengiriman email. Tunggu sebelum mencoba lagi. (429)';
  const code = error.code && /^[a-z0-9_]{1,80}$/.test(error.code) ? error.code : 'signup_failed';
  if (error.status && error.status >= 500) return `Layanan akun mengalami kesalahan. Hubungi pengelola dengan kode: ${code} (${error.status}).`;
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) return 'Layanan akun belum dapat dihubungi. Periksa koneksi dan coba lagi.';
  return `Pendaftaran belum berhasil. Hubungi pengelola dengan kode: ${code}${error.status ? ` (${error.status})` : ''}.`;
}

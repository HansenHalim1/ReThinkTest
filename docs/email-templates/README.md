# ReThink transactional email templates

These are ready-to-paste Supabase templates. They use inline styles, presentation tables, a readable text hierarchy, a primary action, and a fallback link. No hosted images, tracking or extra runtime dependencies are required.

## Apply in Supabase

Open https://supabase.com/dashboard/project/hhovzaaeolcfynyetabf/auth/templates and select the matching template:

| Supabase template | Subject | HTML file |
| --- | --- | --- |
| Confirm signup | Konfirmasi emailmu untuk mulai belajar di ReThink | `confirm-signup.html` |
| Reset password | Atur ulang kata sandi akun ReThink | `reset-password.html` |

Paste each file's full HTML into the template body and save. Keep `{{ .ConfirmationURL }}` intact: Supabase supplies the appropriate secure verification or recovery link. Do not replace it with a hard-coded website URL; that would skip verification.

Confirm Authentication → URL Configuration allows the production root and `/?auth=recovery` redirects. Use a new email after saving; previously delivered emails do not change.

These templates have been prepared locally, not applied to the live Supabase project. The project publishable/secret API keys do not grant Management API access to change email templates. Apply them in the dashboard or use a connected Supabase management integration. No real verification emails were sent during automated checks.

Local HTML previews can be opened directly in a browser. Test delivery in the email clients your users actually use after applying the templates; desktop/mobile browser previews do not establish compatibility with every inbox.

// Email links should return to the published website, including links requested
// from localhost or a preview deployment. Override this for a separate test site.
export function authRedirectUrl(recovery = false): string {
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://re-think-test.vercel.app');
  return new URL(recovery ? '/?auth=recovery' : '/', site.origin).toString();
}

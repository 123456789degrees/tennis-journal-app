const { createClient } = require('@supabase/supabase-js');

// Deleting your OWN account isn't something the client-side Supabase SDK can
// do (it requires the service-role key, which must never reach the
// browser) — so this one action runs server-side instead. The request must
// carry a real, currently-valid access token for the account being deleted;
// there's no "delete this other user" path here at all.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers.authorization ?? '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!accessToken) {
    res.status(401).json({ error: 'Missing access token' });
    return;
  }

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    res.status(500).json({ error: 'Server is not configured for account deletion.' });
    return;
  }

  const admin = createClient(url, serviceRoleKey);

  // The access token proves who's asking — getUser(token) validates it and
  // returns the user it belongs to, so this can only ever delete the
  // account making the request.
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
  if (userError || !userData.user) {
    res.status(401).json({ error: 'Invalid or expired session.' });
    return;
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id);
  if (deleteError) {
    res.status(500).json({ error: deleteError.message });
    return;
  }

  res.status(200).json({ ok: true });
};

import { Client, Query, TablesDB, Users } from 'node-appwrite';

/**
 * Agency licence review for AllInOne.
 *
 * This is the ONLY thing that marks an agency as verified. The app lets an
 * agency submit a licence number (profile.licenseNumber, still unverified =
 * "under review"); a person then approves or rejects it here.
 *
 * ADMIN ONLY. This Function has no "Execute access" roles, so it can only be
 * run from the Appwrite Console ("Execute now") or with a server API key. As a
 * second lock it also refuses any call that carries a signed-in user id.
 *
 * Run from Console -> Functions -> review-license -> Execute now, method POST,
 * body:
 *   {"action":"list"}                                       list agencies waiting for review
 *   {"userId":"<id>","decision":"approve"}                  approve
 *   {"userId":"<id>","decision":"reject","reason":"..."}    reject (agency sees the reason)
 *
 * What "approve" writes:
 *   - profiles.licenseVerified = true   (what the app and the buyer list read)
 *   - auth user label "verified_agency" (tamper-proof copy: a signed-in user
 *                                        cannot edit their own labels, unlike
 *                                        their profile row)
 *   - auth user prefs.licenseReview     (status shown on the agency's screen)
 * "reject" clears licenseNumber + the flag + the label, and stores the reason.
 */

export const VERIFIED_LABEL = 'verified_agency';

const REQUIRED_ENV = [
  'APPWRITE_ENDPOINT',
  'APPWRITE_PROJECT_ID',
  'APPWRITE_API_KEY',
  'APPWRITE_DATABASE_ID',
  'APPWRITE_PROFILES_TABLE_ID',
];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * FUTURE: automatic licence check through an external API.
 *
 * Today this returns null, which means "no automatic answer - a person must
 * decide", so `decision` has to be sent in the request. To automate later,
 * call your licence-registry API here and return
 *   { decision: 'approve' }                       or
 *   { decision: 'reject', reason: '...' }
 * Nothing else in the app or in this file has to change: a request without a
 * `decision` runs this check, and the result flows through the same approve /
 * reject code below.
 */
// eslint-disable-next-line no-unused-vars
const autoCheck = async (licenseNumber, profile) => null;

const parseBody = req => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
    return body && typeof body === 'object' ? body : {};
  } catch {
    throw new HttpError(400, 'Body must be valid JSON.');
  }
};

const getProfile = async (tables, databaseId, tableId, userId) => {
  try {
    return await tables.getRow({ databaseId, tableId, rowId: userId });
  } catch (err) {
    if (!(err && err.code === 404)) throw err;
  }
  // Fallback for profiles whose row id is not the user id.
  const { rows } = await tables.listRows({
    databaseId,
    tableId,
    queries: [Query.equal('userId', userId), Query.limit(1)],
  });
  if (rows.length === 0) throw new HttpError(404, `No profile found for user ${userId}.`);
  return rows[0];
};

export default async ({ req, res, log, error }) => {
  try {
    const missing = REQUIRED_ENV.filter(name => !process.env[name]);
    if (missing.length > 0) {
      error(`Missing environment variables: ${missing.join(', ')}`);
      throw new HttpError(500, `Function is not configured. Missing: ${missing.join(', ')}`);
    }

    // Second lock: a signed-in app user must never be able to run this.
    if (req.headers['x-appwrite-user-id']) {
      throw new HttpError(403, 'This function is admin-only.');
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const tables = new TablesDB(client);
    const users = new Users(client);
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const tableId = process.env.APPWRITE_PROFILES_TABLE_ID;

    const body = parseBody(req);

    // ---- list agencies waiting for review ----
    if (body.action === 'list') {
      const { rows } = await tables.listRows({
        databaseId,
        tableId,
        queries: [
          Query.equal('role', 'agency'),
          Query.equal('licenseVerified', false),
          Query.isNotNull('licenseNumber'),
          Query.limit(100),
        ],
      });
      return res.json({
        count: rows.length,
        pending: rows.map(row => ({
          userId: row.userId ?? row.$id,
          name: row.name,
          licenseNumber: row.licenseNumber,
          phone: row.phone ?? null,
          city: row.city ?? null,
          state: row.state ?? null,
          submittedAt: row.$updatedAt,
        })),
      });
    }

    // ---- approve / reject ----
    const userId = body.userId;
    if (!userId || typeof userId !== 'string') {
      throw new HttpError(400, 'userId is required.');
    }

    const profile = await getProfile(tables, databaseId, tableId, userId);
    if (profile.role !== 'agency') {
      throw new HttpError(400, 'Only agency profiles have a licence to review.');
    }

    let decision = body.decision;
    let reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (decision === undefined) {
      const auto = await autoCheck(profile.licenseNumber, profile);
      if (!auto) {
        throw new HttpError(400, 'decision is required: "approve" or "reject".');
      }
      decision = auto.decision;
      reason = auto.reason ?? reason;
    }
    if (decision !== 'approve' && decision !== 'reject') {
      throw new HttpError(400, 'decision must be "approve" or "reject".');
    }
    if (decision === 'approve' && !(profile.licenseNumber && String(profile.licenseNumber).trim())) {
      throw new HttpError(400, 'This agency has not submitted a licence number yet.');
    }

    const approved = decision === 'approve';
    const updatedProfile = await tables.updateRow({
      databaseId,
      tableId,
      rowId: profile.$id,
      data: approved
        ? { licenseVerified: true }
        : { licenseVerified: false, licenseNumber: null },
    });

    // The profile row is now the truth the app reads. The label and prefs are
    // written next; if either fails, the decision still stands and the caller
    // is told, so it can be fixed (usually a missing users.write API scope).
    const warnings = [];
    try {
      const user = await users.get({ userId });
      const labels = (user.labels ?? []).filter(label => label !== VERIFIED_LABEL);
      await users.updateLabels({
        userId,
        labels: approved ? [...labels, VERIFIED_LABEL] : labels,
      });
      const prefs = await users.getPrefs({ userId });
      await users.updatePrefs({
        userId,
        prefs: {
          ...prefs,
          licenseReview: {
            status: approved ? 'approved' : 'rejected',
            reason: approved ? '' : reason,
            at: new Date().toISOString(),
          },
        },
      });
    } catch (userErr) {
      const message = `Label/prefs not updated: ${userErr.message ?? String(userErr)} (API key needs the users.read and users.write scopes)`;
      error(message);
      warnings.push(message);
    }

    log(`Licence ${approved ? 'approved' : 'rejected'} for ${userId}`);
    return res.json({
      ok: true,
      decision,
      userId,
      licenseVerified: Boolean(updatedProfile.licenseVerified),
      warnings,
    });
  } catch (err) {
    error(err.message ?? String(err));
    const status = err instanceof HttpError ? err.status : 500;
    return res.json(
      { error: err instanceof HttpError ? err.message : `Unexpected error: ${err.message ?? String(err)}` },
      status,
    );
  }
};
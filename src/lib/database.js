const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const PENDING_SYNC_STORAGE_KEY = "ut_pending_sync_v1";

const ACCESS_TOKEN_STORAGE_KEY = "ut_supabase_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "ut_supabase_refresh_token";
const ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY =
  "ut_supabase_access_token_expires_at";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || "";
}

function saveAuthSession(data, fallbackEmail = "") {
  if (data.access_token)
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, data.access_token);
  if (data.refresh_token)
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refresh_token);
  if (data.expires_in) {
    localStorage.setItem(
      ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY,
      String(Date.now() + Number(data.expires_in) * 1000),
    );
  }
  const email =
    data.user?.email ||
    fallbackEmail ||
    localStorage.getItem("ut_user_email") ||
    "";
  if (email) localStorage.setItem("ut_user_email", email);
  return email;
}

export function supabaseHeaders({ preferReturn = false } = {}) {
  const token = getAccessToken() || SUPABASE_ANON_KEY;
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(preferReturn ? { Prefer: "return=representation" } : {}),
  };
}

let refreshSessionPromise = null;

async function refreshAuthSession() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || "";
  if (!refreshToken) throw new Error("Session expired. Please sign in again.");
  if (!refreshSessionPromise) {
    refreshSessionPromise = fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          const error = new Error(
            data.error_description || data.msg || "Session refresh failed.",
          );
          error.status = 401;
          throw error;
        }
        saveAuthSession(data);
        return data.access_token;
      })
      .finally(() => {
        refreshSessionPromise = null;
      });
  }
  return refreshSessionPromise;
}

export async function supabaseRequest(path, options = {}, allowRefresh = true) {
  if (!USE_SUPABASE) throw new Error("Supabase is not configured.");
  const response = await fetch(`${SUPABASE_URL}${path}`, options);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }
  if (
    response.status === 401 &&
    allowRefresh &&
    localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  ) {
    const accessToken = await refreshAuthSession();
    return supabaseRequest(
      path,
      {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${accessToken}`,
        },
      },
      false,
    );
  }
  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.msg ||
        data?.error_description ||
        (typeof data === "string" ? data : "") ||
        "Supabase request failed.",
    );
    error.status = response.status;
    error.code = data?.code || "";
    throw error;
  }
  return data;
}

export function fetchTable(table, orderBy) {
  return supabaseRequest(`/rest/v1/${table}?select=*&order=${orderBy}.asc`, {
    method: "GET",
    headers: supabaseHeaders(),
  });
}

export async function upsertRows(table, rows, conflictKey) {
  if (!rows.length) return [];
  return supabaseRequest(`/rest/v1/${table}?on_conflict=${conflictKey}`, {
    method: "POST",
    headers: {
      ...supabaseHeaders({ preferReturn: true }),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
}

async function deleteMissingRows(table, key, currentKeys) {
  const existing = await supabaseRequest(`/rest/v1/${table}?select=${key}`, {
    method: "GET",
    headers: supabaseHeaders(),
  });
  const keep = new Set(currentKeys);
  const staleKeys = existing
    .map((row) => row[key])
    .filter((value) => !keep.has(value));
  await Promise.all(
    staleKeys.map((value) =>
      supabaseRequest(
        `/rest/v1/${table}?${key}=eq.${encodeURIComponent(value)}`,
        { method: "DELETE", headers: supabaseHeaders() },
      ),
    ),
  );
}

export async function syncTable(table, rows, key) {
  await upsertRows(table, rows, key);
  await deleteMissingRows(
    table,
    key,
    rows.map((row) => row[key]),
  );
}

export async function signIn(email, password) {
  if (!USE_SUPABASE) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable access.",
    );
  }
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error_description || data.msg || "Login failed.");
  return saveAuthSession(data, email);
}

export function signOut() {
  localStorage.removeItem("ut_user_email");
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY);
}

export function getStoredUserEmail() {
  if (!USE_SUPABASE || !getAccessToken()) {
    signOut();
    return "";
  }
  return localStorage.getItem("ut_user_email") || "";
}

export function getStoredPendingSync(userEmail) {
  if (typeof localStorage === "undefined" || !userEmail) return null;
  try {
    const stored = JSON.parse(
      localStorage.getItem(PENDING_SYNC_STORAGE_KEY) || "null",
    );
    return stored?.userEmail === userEmail && stored.payload ? stored : null;
  } catch {
    return null;
  }
}

export function storePendingSync(userEmail, payload) {
  if (typeof localStorage === "undefined" || !userEmail) return;
  localStorage.setItem(
    PENDING_SYNC_STORAGE_KEY,
    JSON.stringify({
      userEmail,
      payload,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function clearPendingSync(userEmail) {
  if (typeof localStorage === "undefined") return;
  if (getStoredPendingSync(userEmail))
    localStorage.removeItem(PENDING_SYNC_STORAGE_KEY);
}

export function createDatabaseSnapshotTools(deps) {
  const {
    normalizeCourseClassPlans,
    normalizeLecturer,
    normalizeTermPlotting,
  } = deps;

  async function fetchCourseClassPlans() {
    try {
      const rows = await fetchTable("course_class_plans", "term_code");
      return {
        supported: true,
        plans: normalizeCourseClassPlans(Array.isArray(rows) ? rows : []),
      };
    } catch (error) {
      if (error.status === 404 || ["42P01", "PGRST205"].includes(error.code))
        return { supported: false, plans: {} };
      throw error;
    }
  }

  async function fetchDatabaseSnapshot() {
    const [
      lecturerRows,
      courseRows,
      termRows,
      plottingRows,
      courseClassPlanResult,
    ] = await Promise.all([
      fetchTable("lecturers", "name"),
      fetchTable("courses", "code"),
      fetchTable("academic_terms", "code"),
      fetchTable("term_plottings", "id"),
      fetchCourseClassPlans(),
    ]);
    return {
      lecturers: Array.isArray(lecturerRows)
        ? lecturerRows.map(normalizeLecturer)
        : [],
      courses: Array.isArray(courseRows) ? courseRows : [],
      terms: Array.isArray(termRows) ? termRows : [],
      termPlottings: Array.isArray(plottingRows)
        ? plottingRows.map(normalizeTermPlotting)
        : [],
      courseClassPlans: courseClassPlanResult.plans,
      courseClassPlansSupported: courseClassPlanResult.supported,
    };
  }

  async function fetchPublicDatabaseSnapshot() {
    const [lecturerRows, courseRows, termRows, plottingRows] =
      await Promise.all([
        fetchTable("public_lecturer_profiles", "name"),
        fetchTable("public_courses", "code"),
        fetchTable("public_academic_terms", "code"),
        fetchTable("public_term_plottings", "id"),
      ]);
    return {
      lecturers: Array.isArray(lecturerRows)
        ? lecturerRows.map(normalizeLecturer)
        : [],
      courses: Array.isArray(courseRows) ? courseRows : [],
      terms: Array.isArray(termRows) ? termRows : [],
      termPlottings: Array.isArray(plottingRows)
        ? plottingRows.map(normalizeTermPlotting)
        : [],
    };
  }

  async function fetchLecturerLabelColumnSupport() {
    if (!USE_SUPABASE) return false;
    try {
      await supabaseRequest(
        "/rest/v1/lecturers?select=rating,warning_note&limit=1",
        {
          method: "GET",
          headers: supabaseHeaders(),
        },
      );
      return true;
    } catch {
      return false;
    }
  }

  return {
    fetchDatabaseSnapshot,
    fetchPublicDatabaseSnapshot,
    fetchLecturerLabelColumnSupport,
  };
}

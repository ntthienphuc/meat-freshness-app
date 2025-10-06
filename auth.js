/* ============================================
   AUTHENTICATION SYSTEM
   Using Supabase for backend
   ============================================ */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Safe base64 encoding for Unicode strings
function safeBtoa(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.warn('btoa encoding failed, using fallback', e);
    return Buffer.from(str).toString('base64');
  }
}

function safeAtob(str) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    console.warn('atob decoding failed, using fallback', e);
    return Buffer.from(str, 'base64').toString();
  }
}

// Initialize Supabase client
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;

// Current user state
let currentUser = null;
let currentProfile = null;

// Admin credentials (stored in code for simplicity - in production use env vars)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'thittuoi2025';

// ============================================
// AUTH STATE MANAGEMENT
// ============================================

async function initializeAuth() {
  if (!supabase) {
    console.warn('Supabase not configured - running in demo mode');
    return;
  }

  // Check for existing session
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    currentUser = session.user;
    await loadUserProfile();
    updateUIForAuthState(true);
  } else {
    updateUIForAuthState(false);
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      await loadUserProfile();
      updateUIForAuthState(true);
      showToast('Đăng nhập thành công! 🎉', 'success');
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentProfile = null;
      updateUIForAuthState(false);
      showToast('Đã đăng xuất', 'success');
    }
  });
}

// ============================================
// USER REGISTRATION
// ============================================

async function registerUser(username, password, displayName = '') {
  if (!supabase) {
    showToast('Supabase chưa được cấu hình', 'error');
    return { error: 'No Supabase' };
  }

  try {
    // Create email from username (internal use)
    const email = `${username}@thittuoi.local`;

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName || username
        }
      }
    });

    if (authError) throw authError;

    // Determine role (admin if credentials match)
    const role = (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) ? 'admin' : 'user';

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        username,
        display_name: displayName || username,
        role
      });

    if (profileError) throw profileError;

    return { data: authData, error: null };
  } catch (error) {
    console.error('Registration error:', error);
    return { data: null, error };
  }
}

// ============================================
// USER LOGIN
// ============================================

async function loginUser(username, password) {
  if (!supabase) {
    showToast('Supabase chưa được cấu hình', 'error');
    return { error: 'No Supabase' };
  }

  try {
    const email = `${username}@thittuoi.local`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Login error:', error);
    return { data: null, error };
  }
}

// ============================================
// USER LOGOUT
// ============================================

async function logoutUser() {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Logout error:', error);
    showToast('Lỗi khi đăng xuất', 'error');
  }
}

// ============================================
// LOAD USER PROFILE
// ============================================

async function loadUserProfile() {
  if (!supabase || !currentUser) return null;

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (error) throw error;

    currentProfile = data;
    return data;
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
}

// ============================================
// SAVED ARTICLES
// ============================================

async function saveArticle(articleType, articleId, articleTitle) {
  if (!supabase || !currentUser) {
    showToast('Vui lòng đăng nhập để lưu bài viết', 'error');
    return { error: 'Not authenticated' };
  }

  try {
    const { data, error } = await supabase
      .from('saved_articles')
      .insert({
        user_id: currentUser.id,
        article_type: articleType,
        article_id: articleId,
        article_title: articleTitle
      });

    if (error) throw error;

    showToast('Đã lưu bài viết! 💾', 'success');
    return { data, error: null };
  } catch (error) {
    if (error.code === '23505') {
      showToast('Bài viết đã được lưu trước đó', 'error');
    } else {
      showToast('Lỗi khi lưu bài viết', 'error');
    }
    return { data: null, error };
  }
}

async function unsaveArticle(articleType, articleId) {
  if (!supabase || !currentUser) return;

  try {
    const { error } = await supabase
      .from('saved_articles')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('article_type', articleType)
      .eq('article_id', articleId);

    if (error) throw error;

    showToast('Đã bỏ lưu bài viết', 'success');
  } catch (error) {
    console.error('Error unsaving article:', error);
    showToast('Lỗi khi bỏ lưu', 'error');
  }
}

async function getSavedArticles() {
  if (!supabase || !currentUser) return [];

  try {
    const { data, error } = await supabase
      .from('saved_articles')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('saved_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting saved articles:', error);
    return [];
  }
}

async function isArticleSaved(articleType, articleId) {
  if (!supabase || !currentUser) return false;

  try {
    const { data, error } = await supabase
      .from('saved_articles')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('article_type', articleType)
      .eq('article_id', articleId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    return false;
  }
}

// ============================================
// DETECTION HISTORY
// ============================================

async function saveDetectionHistory(meatType, freshnessLevel, imageUrl = '', resultData = {}) {
  if (!supabase) return { error: 'No Supabase' };

  try {
    const { data, error } = await supabase
      .from('detection_history')
      .insert({
        user_id: currentUser?.id || null, // Null for anonymous users
        meat_type: meatType,
        freshness_level: freshnessLevel,
        image_url: imageUrl,
        result_data: resultData
      });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving detection:', error);
    return { data: null, error };
  }
}

async function getDetectionHistory(limit = 20) {
  if (!supabase || !currentUser) return [];

  try {
    const { data, error } = await supabase
      .from('detection_history')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting detection history:', error);
    return [];
  }
}

// ============================================
// UI UPDATES
// ============================================

function updateUIForAuthState(isAuthenticated) {
  const userIcon = document.querySelector('.admin-icon');
  const navBtns = document.querySelectorAll('.nav__btn');

  if (isAuthenticated && currentProfile) {
    // Update user icon
    if (userIcon) {
      userIcon.textContent = currentProfile.role === 'admin' ? '⚙️' : '👤';
      userIcon.title = currentProfile.display_name || currentProfile.username;
    }

    // Show user profile in nav
    updateNavigationForAuth(true);
  } else {
    // Not authenticated
    if (userIcon) {
      userIcon.textContent = '👤';
      userIcon.title = 'Đăng nhập';
    }

    updateNavigationForAuth(false);
  }
}

function updateNavigationForAuth(isAuth) {
  // This will be called to update nav items based on auth state
  // Implementation depends on your nav structure
}

// ============================================
// CHECK FUNCTIONS
// ============================================

function isAuthenticated() {
  return !!currentUser;
}

function isAdmin() {
  return currentProfile?.role === 'admin';
}

function getCurrentUser() {
  return currentUser;
}

function getCurrentProfile() {
  return currentProfile;
}

// ============================================
// EXPORTS
// ============================================

window.authSystem = {
  initialize: initializeAuth,
  register: registerUser,
  login: loginUser,
  logout: logoutUser,
  saveArticle,
  unsaveArticle,
  getSavedArticles,
  isArticleSaved,
  saveDetectionHistory,
  getDetectionHistory,
  isAuthenticated,
  isAdmin,
  getCurrentUser,
  getCurrentProfile,
  // Safe encoding utilities
  safeBtoa,
  safeAtob
};

// Auto-initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
  initializeAuth();
}

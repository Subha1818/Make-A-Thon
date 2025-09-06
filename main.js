import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://dspkjjiqjegytpwjpgay.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcGtqamlxamVneXRwd2pwZ2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDUxODcsImV4cCI6MjA3MjcyMTE4N30.J03R6ult9M-fYh0SCtVivAkP-iRrOA3IKQfrBH79p_E";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Navbar menu toggle for mobile
function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('active');
}

// Modal open function with pop-up animation reset
function openModal(id) {
  const modal = document.getElementById(id);
  modal.style.display = "flex";

  const modalContent = modal.querySelector('.modal-content');
  modalContent.classList.remove('modal-animate');

  // Force reflow to restart animation
  void modalContent.offsetWidth;

  modalContent.classList.add('modal-animate');
}

// Modal close function
function closeModal(id) {
  const modal = document.getElementById(id);
  modal.style.display = "none";
}

// Switch modal from Login to Sign Up with smooth timing
function switchModal() {
  closeModal('loginModal');
  setTimeout(() => {
    openModal('signupModal');
  }, 220);
}

async function handleSignup() {
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  // insert new user
  const { data, error } = await supabase
    .from("users")
    .insert([{ name, email, password }]); // ⚠️ plain password, hash later if needed

  if (error) {
    alert("Signup failed: " + error.message);
  } else {
    alert("Signup successful!");
    closeModal("signupModal");
  }
}
async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("password", password) // ⚠️ match password
    .single();

  if (error || !data) {
    alert("Invalid email or password.");
  } else {
    alert("Login successful!");
    localStorage.setItem("user", JSON.stringify(data));
    closeModal("loginModal");
    openDashboard();
  }
}
function handleLogout() {
  localStorage.removeItem("user");
  alert("Logged out successfully!");
}

// Dashboard access
function openDashboard() {
  const user = localStorage.getItem("user");
  if (user) {
    alert("Redirecting to dashboard...");
    // replace with actual dashboard page
    window.location.href = "#features";
  } else {
    openModal('signupModal');
  }
}
// Optional: Close modal by clicking outside modal content
window.onclick = function(event) {
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");

  if (event.target === loginModal) {
    closeModal('loginModal');
  }
  if (event.target === signupModal) {
    closeModal('signupModal');
  }
};
window.openModal = openModal;
window.closeModal = closeModal;
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.openDashboard = openDashboard;
window.switchModal = switchModal;
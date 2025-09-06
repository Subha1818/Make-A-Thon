// Navbar toggle
function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('active');
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

// Modals
function openModal(id) {
  document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

// Signup
function handleSignup() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  if (name && email && password) {
    localStorage.setItem("user", JSON.stringify({ name, email }));
    alert("Signup successful! You can now access your dashboard.");
    closeModal("signupModal");
  } else {
    alert("Please fill all fields.");
  }
}

// Login
function handleLogin() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (email && password) {
    localStorage.setItem("user", JSON.stringify({ email }));
    alert("Login successful!");
    closeModal("loginModal");
  } else {
    alert("Please enter valid credentials.");
  }
}

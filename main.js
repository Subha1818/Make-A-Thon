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

// Signup form handler
function handleSignup() {
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if (name && email && password) {
    localStorage.setItem("user", JSON.stringify({ name, email }));
    alert("Signup successful! You can now access your dashboard.");
    closeModal("signupModal");
  } else {
    alert("Please fill all fields.");
  }
}

// Login form handler
function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (email && password) {
    localStorage.setItem("user", JSON.stringify({ email }));
    alert("Login successful!");
    closeModal("loginModal");
  } else {
    alert("Please enter valid credentials.");
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

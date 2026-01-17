/**
 * HOMECARE - JavaScript
 * Funcionalidad de la aplicación web
 */

// Estado de la aplicación
const app = {
  isMenuOpen: false,
  currentModal: null,
};

// Configuración
const API_URL = 'http://localhost:8080/api';

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  checkAuth();
});

function initializeApp() {
  console.log('🏠 HOMECARE - Aplicación Inicializada');
  console.log('📱 Modelo: inDriver (Ofertas Competitivas)');
  
  // Sticky header
  handleStickyHeader();
  
  // Smooth scroll
  initializeSmoothScroll();
}

function setupEventListeners() {
  // Menu toggle
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
  }
  
  // Modals
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const getStartedBtn = document.getElementById('getStartedBtn');
  const becomeProviderBtn = document.getElementById('becomeProviderBtn');
  const ctaBtn = document.getElementById('ctaBtn');
  
  if (loginBtn) loginBtn.addEventListener('click', () => openModal('login'));
  if (registerBtn) registerBtn.addEventListener('click', () => openModal('register'));
  if (getStartedBtn) getStartedBtn.addEventListener('click', () => openModal('register'));
  if (becomeProviderBtn) becomeProviderBtn.addEventListener('click', () => openModal('register'));
  if (ctaBtn) ctaBtn.addEventListener('click', () => openModal('register'));
  
  // Close modal buttons
  const closeLoginModal = document.getElementById('closeLoginModal');
  if (closeLoginModal) closeLoginModal.addEventListener('click', closeModal);
  
  // Close modal on outside click
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) closeModal();
    });
  }
  
  // Forms
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
}

// Menu Toggle
function toggleMenu() {
  app.isMenuOpen = !app.isMenuOpen;
  const nav = document.getElementById('nav');
  const menuToggle = document.getElementById('menuToggle');
  
  if (nav) {
    nav.style.display = app.isMenuOpen ? 'flex' : 'none';
  }
  
  if (menuToggle) {
    menuToggle.classList.toggle('active');
  }
}

// Sticky Header
function handleStickyHeader() {
  const header = document.getElementById('header');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Smooth Scroll
function initializeSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Modal Management
function openModal(modalType) {
  app.currentModal = modalType;
  const modal = document.getElementById(`${modalType}Modal`);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal() {
  if (app.currentModal) {
    const modal = document.getElementById(`${app.currentModal}Modal`);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
    app.currentModal = null;
  }
}

// Authentication
function checkAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    console.log('✅ Usuario autenticado');
    updateUIForAuthenticatedUser();
  } else {
    console.log('❌ Usuario no autenticado');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const email = formData.get('email');
  const password = formData.get('password');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      
      console.log('✅ Login exitoso');
      closeModal();
      updateUIForAuthenticatedUser();
      
      // Redirigir según el rol
      if (data.rol === 'CUSTOMER') {
        window.location.href = '/dashboard-cliente.html';
      } else if (data.rol === 'SERVICE_PROVIDER') {
        window.location.href = '/dashboard-proveedor.html';
      }
    } else {
      const error = await response.json();
      alert(`Error: ${error.mensaje || 'Error al iniciar sesión'}`);
    }
  } catch (error) {
    console.error('Error en login:', error);
    alert('Error de conexión. Por favor intenta de nuevo.');
  }
}

function updateUIForAuthenticatedUser() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    // Actualizar UI (ocultar login, mostrar perfil, etc.)
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) {
      registerBtn.textContent = 'Dashboard';
      registerBtn.onclick = () => {
        if (user.rol === 'CUSTOMER') {
          window.location.href = '/dashboard-cliente.html';
        } else {
          window.location.href = '/dashboard-proveedor.html';
        }
      };
    }
  }
}

// Utility Functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

function formatTime(timeString) {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(`2000-01-01T${timeString}`));
}

// Service Worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registrado:', registration);
      })
      .catch(error => {
        console.error('❌ Error al registrar Service Worker:', error);
      });
  });
}

// Export functions if needed
window.app = app;

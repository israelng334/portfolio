// Portfolio JavaScript - Dynamic GitHub Projects Integration

class PortfolioManager {
  constructor() {
    this.githubApiBase = 'https://api.github.com';
    this.defaultUsername = 'israelng334';
    this.projectsCache = new Map();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupSmoothScrolling();
    this.setupFormHandling();
    this.loadInitialProjects();
    this.updateProjectCount();
  }

  setupEventListeners() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
      });
    }

    // GitHub project controls
    const fetchBtn = document.getElementById('fetch-projects');
    const refreshBtn = document.getElementById('refresh-projects');
    const usernameInput = document.getElementById('github-username');

    if (fetchBtn) {
      fetchBtn.addEventListener('click', () => this.fetchGitHubProjects());
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshProjects());
    }

    if (usernameInput) {
      usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.fetchGitHubProjects();
        }
      });
    }

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        if (window.scrollY > 100) {
          navbar.style.background = 'rgba(255, 255, 255, 0.98)';
          navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
          navbar.style.background = 'rgba(255, 255, 255, 0.95)';
          navbar.style.boxShadow = 'none';
        }
      }
    });

    // Intersection Observer for animations
    this.setupScrollAnimations();
  }

  setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          const offsetTop = target.offsetTop - 80; // Account for fixed navbar
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe sections for scroll animations
    document.querySelectorAll('.skill-category, .project-card, .timeline-item, .stat').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  setupFormHandling() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Disable submit button and show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    try {
      // Simulate form submission (replace with actual endpoint)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      this.showNotification('Message sent successfully!', 'success');
      form.reset();
    } catch (error) {
      this.showNotification('Failed to send message. Please try again.', 'error');
    } finally {
      // Restore submit button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // Add notification styles if not already present
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        .notification {
          position: fixed;
          top: 100px;
          right: 20px;
          padding: 1rem 1.5rem;
          border-radius: 0.5rem;
          color: white;
          z-index: 10000;
          transform: translateX(400px);
          transition: transform 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .notification.show {
          transform: translateX(0);
        }
        .notification-success {
          background: #10b981;
        }
        .notification-error {
          background: #ef4444;
        }
        .notification-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .notification-close {
          background: none;
          border: none;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto-hide after 5 seconds
    setTimeout(() => this.hideNotification(notification), 5000);

    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.hideNotification(notification);
    });
  }

  hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  async loadInitialProjects() {
    const username = document.getElementById('github-username')?.value || this.defaultUsername;
    if (username) {
      await this.fetchGitHubProjects(false); // Load silently on initial load
    }
  }

  async fetchGitHubProjects(showLoading = true) {
    const username = document.getElementById('github-username')?.value?.trim() || this.defaultUsername;
    const loadingEl = document.getElementById('loading');
    const projectsGrid = document.getElementById('projects-grid');
    const noProjectsEl = document.getElementById('no-projects');

    if (!username) {
      this.showNotification('Please enter a GitHub username', 'error');
      return;
    }

    if (showLoading && loadingEl) {
      loadingEl.style.display = 'block';
      projectsGrid.style.display = 'none';
      noProjectsEl.style.display = 'none';
    }

    try {
      // Check cache first
      const cacheKey = `projects_${username}`;
      const cacheExpiry = 10 * 60 * 1000; // 10 minutes
      const cached = this.projectsCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp < cacheExpiry)) {
        this.displayProjects(cached.data);
        return;
      }

      const response = await fetch(`${this.githubApiBase}/users/${username}/repos?sort=updated&per_page=50`);
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repos = await response.json();
      
      // Filter and sort repositories
      const includeForks = document.getElementById('include-forks')?.checked ?? true;
      const filteredRepos = repos
        .filter(repo => {
          if (repo.archived) return false; // Always exclude archived repos
          if (!includeForks && repo.fork) return false; // Exclude forks if unchecked
          return true;
        })
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 12); // Limit to 12 most recent projects

      // Cache the results
      this.projectsCache.set(cacheKey, {
        data: filteredRepos,
        timestamp: Date.now()
      });

      this.displayProjects(filteredRepos);
      this.updateProjectCount(filteredRepos.length);
      
      if (showLoading) {
        this.showNotification(`Loaded ${filteredRepos.length} projects for ${username}`, 'success');
      }

    } catch (error) {
      console.error('Error fetching GitHub projects:', error);
      this.showNotification('Failed to fetch GitHub projects. Please check the username and try again.', 'error');
      this.displayNoProjects();
    } finally {
      if (loadingEl) {
        loadingEl.style.display = 'none';
      }
    }
  }

  displayProjects(repos) {
    const projectsGrid = document.getElementById('projects-grid');
    const noProjectsEl = document.getElementById('no-projects');

    if (!projectsGrid) return;

    if (repos.length === 0) {
      this.displayNoProjects();
      return;
    }

    projectsGrid.innerHTML = '';
    projectsGrid.style.display = 'grid';
    noProjectsEl.style.display = 'none';

    repos.forEach(repo => {
      const projectCard = this.createProjectCard(repo);
      projectsGrid.appendChild(projectCard);
    });

    // Trigger scroll animations for new cards
    setTimeout(() => {
      this.setupScrollAnimations();
    }, 100);
  }

  createProjectCard(repo) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    const description = repo.description || 'No description available';
    const language = repo.language || 'Unknown';
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const lastUpdated = new Date(repo.updated_at).toLocaleDateString();

    // Determine language color
    const languageColors = {
      'JavaScript': '#f7df1e',
      'Python': '#3776ab',
      'Java': '#007396',
      'TypeScript': '#3178c6',
      'HTML': '#e34f26',
      'CSS': '#1572b6',
      'C++': '#00599c',
      'C#': '#239120',
      'PHP': '#777bb4',
      'Ruby': '#cc342d',
      'Go': '#00add8',
      'Rust': '#000000',
      'Swift': '#fa7343',
      'Kotlin': '#7f52ff'
    };

    const languageColor = languageColors[language] || '#64748b';

    card.innerHTML = `
      <div class="project-header">
        <h3 class="project-title">
          ${repo.name}
          ${repo.fork ? '<span class="fork-badge"><i class="fas fa-code-branch"></i> Fork</span>' : ''}
        </h3>
        <p class="project-description">${description}</p>
        <span class="project-language" style="background-color: ${languageColor}">
          ${language}
        </span>
      </div>
      <div class="project-stats">
        <span><i class="fas fa-star"></i> ${stars}</span>
        <span><i class="fas fa-code-branch"></i> ${forks}</span>
        <span><i class="fas fa-calendar"></i> ${lastUpdated}</span>
      </div>
      <div class="project-links">
        <a href="${repo.html_url}" target="_blank" class="project-link primary">
          <i class="fab fa-github"></i> View Code
        </a>
        ${repo.homepage ? 
          `<a href="${repo.homepage}" target="_blank" class="project-link secondary">
            <i class="fas fa-external-link-alt"></i> Live Demo
          </a>` : ''
        }
      </div>
    `;

    return card;
  }

  displayNoProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    const noProjectsEl = document.getElementById('no-projects');

    if (projectsGrid && noProjectsEl) {
      projectsGrid.style.display = 'none';
      noProjectsEl.style.display = 'block';
    }
  }

  refreshProjects() {
    const username = document.getElementById('github-username')?.value?.trim() || this.defaultUsername;
    const cacheKey = `projects_${username}`;
    
    // Clear cache for this user
    this.projectsCache.delete(cacheKey);
    
    // Fetch fresh data
    this.fetchGitHubProjects();
  }

  updateProjectCount(count = null) {
    const projectCountEl = document.getElementById('project-count');
    if (projectCountEl) {
      if (count !== null) {
        projectCountEl.textContent = count;
      } else {
        // Default count or fetch from current displayed projects
        const displayedProjects = document.querySelectorAll('.project-card').length;
        projectCountEl.textContent = displayedProjects;
      }
    }
  }

  // Utility method to format numbers
  formatNumber(num) {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  // Method to handle theme switching (for future enhancement)
  toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
  }

  // Method to export portfolio data (for future enhancement)
  exportPortfolioData() {
    const data = {
      projects: Array.from(this.projectsCache.values()),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Initialize the portfolio manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PortfolioManager();
});

// Add mobile menu styles
const mobileMenuStyles = `
  @media (max-width: 768px) {
    .nav-menu {
      position: fixed;
      left: -100%;
      top: 70px;
      flex-direction: column;
      background-color: white;
      width: 100%;
      text-align: center;
      transition: 0.3s;
      box-shadow: 0 10px 27px rgba(0, 0, 0, 0.05);
      padding: 2rem 0;
    }

    .nav-menu.active {
      left: 0;
    }

    .nav-link {
      padding: 1rem;
      display: block;
    }

    .hamburger.active span:nth-child(2) {
      opacity: 0;
    }

    .hamburger.active span:nth-child(1) {
      transform: translateY(8px) rotate(45deg);
    }

    .hamburger.active span:nth-child(3) {
      transform: translateY(-8px) rotate(-45deg);
    }
  }
`;

// Add the mobile menu styles to the document
if (!document.querySelector('#mobile-menu-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'mobile-menu-styles';
  styleElement.textContent = mobileMenuStyles;
  document.head.appendChild(styleElement);
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PortfolioManager;
}
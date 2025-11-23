// Mobile Menu Toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        });
    });
}

// Navbar Scroll Effect
const nav = document.querySelector('.nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Form Submission Handler
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            message: formData.get('message')
        };

        // For now, just create a mailto link
        // Later you can integrate with a backend service like Formspree, Netlify Forms, etc.
        const mailtoLink = `mailto:allerick@pirisk.com.au?subject=Contact from ${data.name}&body=Name: ${data.name}%0D%0AEmail: ${data.email}%0D%0APhone: ${data.phone}%0D%0A%0D%0AMessage:%0D%0A${data.message}`;

        window.location.href = mailtoLink;

        // Show success message
        showNotification('Thank you! Your message has been sent.', 'success');
        contactForm.reset();
    });
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 24px;
        background: ${type === 'success' ? '#4B9FA0' : '#2D7A7C'};
        color: white;
        padding: 16px 24px;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
    `;

    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add notification animations to the page
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    /* Mobile Menu Styles */
    @media (max-width: 768px) {
        .nav-links {
            position: fixed;
            top: 92px;
            left: 0;
            right: 0;
            background: white;
            flex-direction: column;
            padding: 24px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            transform: translateY(-120%);
            opacity: 0;
            transition: all 0.3s ease;
            gap: 16px;
        }
        
        .nav-links.active {
            transform: translateY(0);
            opacity: 1;
        }
        
        .mobile-menu-btn.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .mobile-menu-btn.active span:nth-child(2) {
            opacity: 0;
        }
        
        .mobile-menu-btn.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
        }
    }
`;
document.head.appendChild(style);

// Intersection Observer for Scroll Animations
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

// Observe service cards
document.querySelectorAll('.service-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// ==============================================
// ASSISTABLE GRACE WIDGET INTEGRATION
// ==============================================

// Talk to Grace Button Handler
const openGraceBtn = document.getElementById('openGraceBtn');

if (openGraceBtn) {
    openGraceBtn.addEventListener('click', () => {
        console.log('Grace button clicked');

        // Try to open Assistable widget
        if (window.Assistable && typeof window.Assistable.open === 'function') {
            console.log('Opening Assistable widget');
            window.Assistable.open();
        } else if (window.AssistableWidget && typeof window.AssistableWidget.open === 'function') {
            console.log('Opening AssistableWidget');
            window.AssistableWidget.open();
        } else {
            console.log('Assistable not loaded yet, waiting...');
            // If not loaded yet, wait and try again
            setTimeout(() => {
                if (window.Assistable && typeof window.Assistable.open === 'function') {
                    window.Assistable.open();
                } else if (window.AssistableWidget && typeof window.AssistableWidget.open === 'function') {
                    window.AssistableWidget.open();
                } else {
                    console.error('Assistable widget not loaded after waiting');
                    // Fallback: open in new window
                    alert('Opening Grace in a new window...');
                    window.open('https://iframes.ai/o/1763877348485x435569904433233900?color=10A37F', '_blank', 'width=400,height=600');
                }
            }, 1500);
        }
    });
}

// Hide the default Assistable bubble (we only want the button to trigger it)
window.addEventListener('load', () => {
    setTimeout(() => {
        // Try multiple selectors for the Assistable bubble
        const selectors = [
            '[data-assistable-bubble]',
            '.assistable-bubble',
            '#assistable-bubble',
            '[class*="assistable"]',
            'iframe[src*="assistable"]'
        ];

        selectors.forEach(selector => {
            const bubble = document.querySelector(selector);
            if (bubble && bubble.tagName !== 'SCRIPT') {
                console.log('Hiding Assistable bubble:', selector);
                bubble.style.display = 'none';
            }
        });
    }, 2000);
});

// Log when Assistable loads
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.Assistable) {
            console.log('Assistable loaded successfully');
        } else if (window.AssistableWidget) {
            console.log('AssistableWidget loaded successfully');
        } else {
            console.warn('Assistable widget may not have loaded. Check network tab for errors.');
        }
    }, 3000);
});

// Log to console
console.log('%c PiRisk Management ', 'background: linear-gradient(135deg, #2D7A7C 0%, #7BC4C5 100%); color: white; padding: 8px 16px; font-weight: bold; font-size: 16px;');
console.log('Website built with ❤️ for construction commercial excellence');

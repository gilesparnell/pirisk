# PiRisk Management Website

Modern, professional website for PiRisk Management - Construction Commercial Consulting.

## 🚀 Quick Deploy to Netlify

### Option 1: Drag & Drop (Easiest)

1. Zip this entire folder
2. Go to [app.netlify.com](https://app.netlify.com)
3. Sign up / Log in
4. Drag the zip file onto the Netlify dashboard
5. Done! You get a URL like `amazing-pirisk-123456.netlify.app`

### Option 2: GitHub + Netlify (Recommended)

1. **Create GitHub Repository**
```bash
git init
git add .
git commit -m "Initial commit: PiRisk Management website"
gh repo create pirisk-website --public --source=.
git push -u origin main
```

2. **Deploy on Netlify**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "New site from Git"
   - Connect to GitHub
   - Select `pirisk-website` repository
   - Build settings: (leave blank for static site)
   - Click "Deploy site"

3. **Connect Custom Domain**
   - In Netlify: Site settings → Domain management
   - Click "Add custom domain"
   - Enter: `pirisk.com.au` or `www.pirisk.com.au`
   - Netlify provides DNS records

4. **Update Route 53**
   - Add CNAME record in Route 53:
   - Name: `www` (or `@` for root)
   - Value: `your-site-name.netlify.app`
   - Or use Netlify DNS (easier)

## 📁 Project Structure

```
pirisk-website/
├── index.html       # Main HTML file
├── styles.css       # Styling with teal gradient theme
├── script.js        # JavaScript for interactions
├── logo.png         # PiRisk logo
└── README.md        # This file
```

## 🎨 Features

- ✅ Modern Web 3.0 design with teal gradient
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Smooth scroll animations
- ✅ Service cards with hover effects
- ✅ Contact form (currently using mailto, can upgrade)
- ✅ Fast loading, zero dependencies
- ✅ SEO optimized
- ✅ Accessible

## 🛠️ Customization

### Update Content
- Edit `index.html` to change text, services, contact info
- All content is in plain HTML - easy to modify

### Change Colors
- Edit CSS variables in `styles.css`:
```css
:root {
    --teal-dark: #2D7A7C;
    --teal-mid: #4B9FA0;
    --teal-light: #7BC4C5;
    /* ... */
}
```

### Add Images
- Place images in the folder
- Reference in HTML: `<img src="your-image.jpg">`

## 📧 Contact Form Setup

Currently using `mailto:` links. For a better experience, integrate:

### Option 1: Netlify Forms (Free)
Add `netlify` attribute to form in `index.html`:
```html
<form name="contact" method="POST" data-netlify="true">
```

### Option 2: Formspree
1. Sign up at [formspree.io](https://formspree.io)
2. Update form action: `action="https://formspree.io/f/YOUR_ID"`

### Option 3: Email API
Integrate with SendGrid, AWS SES, or similar

## 🔧 Future Enhancements

- [ ] Blog section for industry insights
- [ ] Case studies / project showcase
- [ ] Client testimonials
- [ ] Stripe integration for invoicing
- [ ] CMS integration (Netlify CMS, Contentful)
- [ ] Analytics (Google Analytics, Plausible)

## 💰 Costs

- **Netlify Hosting**: FREE
- **Custom Domain**: Already owned (pirisk.com.au)
- **SSL Certificate**: FREE (auto-provisioned by Netlify)

Total: $0/month 🎉

## 📞 Support

For questions or updates, contact:
- Email: allerick@pirisk.com.au
- Phone: +61 401 805 618

---

Built with ❤️ for PiRisk Management

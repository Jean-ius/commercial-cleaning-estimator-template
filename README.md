# Commercial Cleaning Product Template (CleanCommand Pro)

A complete, turnkey commercial cleaning website, instant rate estimator, walkthrough lead capture, and proposal generation system.

Built specifically for commercial cleaning & janitorial business owners or digital agencies who want to deploy a high-converting digital sales infrastructure in minutes with **zero ongoing database costs**.

---

## 🌟 Included Features

- **Corporate Authority Website**: Sector-tailored cleaning solutions, ISSA standards badges, trust statistics, and comparison matrix.
- **Instant Commercial Rate Calculator**: Real-time pricing calibrated to square footage (1,000 – 100,000+ sq ft), 6 facility sectors, 6 cleaning frequencies, and optional specialty add-ons.
- **Walkthrough Booking Modal**: Directly captures qualified facility manager leads into your own private Google Sheets CRM via automated Webhook.
- **Commercial Proposal Generator**: Instant, print-ready, 1-page executive Scope of Work proposal with itemized investment schedule and dual signature authorization blocks.
- **Zero-Database Architecture**: Leads save straight to Google Sheets using Google Apps Script. No monthly database fees or backend maintenance required.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` to see your live system.

### 3. Build for Production
```bash
npm run build
```

---

## ⚙️ Customization in 3 Minutes

All branding, contact information, and pricing logic are centralized in **`src/config/clientConfig.ts`**:

```typescript
export const defaultClientBrand: ClientBrandConfig = {
  companyName: "Your Cleaning Company Name",
  tagline: "Corporate Janitorial & Facility Sanitization Engineered for Zero Disruption",
  primaryCity: "Your City, State",
  serviceAreas: [
    "Downtown & Business District",
    "North Suburbs & Tech Parks",
    "Industrial & Logistics Corridor"
  ],
  phone: "(555) 000-0000",
  email: "contracts@yourdomain.com",
  websiteUrl: "https://yourdomain.com",
  address: "123 Business Way, Suite 100, City, State ZIP",
  licenseNumber: "LIC-2026-XXXX",
  insuranceCoverage: "$2,000,000 Commercial General Liability & Full Bond",
  primaryAccentColor: "#2563EB", // Hex color for your brand
  foundedYear: "2018",
  googleAppsScriptUrl: "https://script.google.com/macros/s/YOUR_DEPLOYED_URL/exec"
};
```

---

## 📊 2-Minute Google Sheets CRM Setup

To have walkthrough requests automatically appear in your own Google Sheet:

1. Open [Google Sheets](https://sheets.new) and create a new sheet.
2. In the top menu, click **Extensions > Apps Script**.
3. Open `src/data/googleAppsScriptCode.ts` from this project, copy the template script, and paste it into `Code.gs`.
4. Click **Deploy > New Deployment**.
5. Choose **Web App**, set **Execute as: "Me"**, and **Who has access: "Anyone"**.
6. Copy the resulting **Web App URL**.
7. Paste this URL into `googleAppsScriptUrl` in `src/config/clientConfig.ts`.

All new walkthrough bookings will now automatically format headers and log leads in real time!

---

## 🌐 1-Click Deployment to Vercel / Netlify

This project is fully static and production-ready:
1. Push this repository to your GitHub account.
2. Go to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) and click **Add New Project**.
3. Select this repository and click **Deploy** (build command `npm run build`, output directory `dist`).
4. Add your custom domain in the hosting dashboard.

---

## 📄 License
Commercial Cleaning Digital Product Template — All Rights Reserved.

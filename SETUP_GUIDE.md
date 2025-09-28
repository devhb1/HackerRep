# 🚀 **HackerRep Setup Guide for Hackers**

This guide will help you set up HackerRep for development and production use.

## 📋 **Prerequisites**

- Node.js 18+ and npm/pnpm
- Git
- Supabase account
- GitHub account (for OAuth)
- WalletConnect account

## 🛠️ **Quick Setup (5 minutes)**

### 1. **Clone and Install**
```bash
git clone <your-repo-url>
cd hacker-rep
npm install
# or
pnpm install
```

### 2. **Environment Configuration**
Create `.env.local` file with these variables:

```bash
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # or your production URL
```

### 3. **Database Setup**
1. Go to your Supabase Dashboard → SQL Editor
2. Run the `FIXED_DATABASE_SETUP.sql` script
3. This creates all required tables and triggers

### 4. **Start Development**
```bash
npm run dev
# or
pnpm dev
```

Visit `http://localhost:3000` and you're ready to hack! 🎉

## 🔧 **Detailed Configuration**

### **Supabase Setup**
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy your Project URL and anon key
4. For service role key, go to Settings → API → Service Role Key

### **GitHub OAuth Setup**
1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/applications/new)
2. Create new OAuth App with:
   - **Application name**: HackerRep
   - **Homepage URL**: `http://localhost:3000` (or your domain)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github`
3. Copy Client ID and generate Client Secret

### **WalletConnect Setup**
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID

## 🏗️ **Architecture Overview**

### **Level 1: ZK Proof Reputation**
- GitHub credential verification via OAuth
- Academic credential verification via PDF upload
- zkPDF-style proof generation
- Base reputation scoring

### **Level 2: Self Protocol Verification**
- Mobile QR code verification
- Demographic data collection
- Indian nationality requirement
- Age verification (18+)

### **Level 3: Cultural Intelligence Voting**
- Self Protocol verification requirement
- Demographic-based voting power
- Age-based mentorship incentives
- Gender diversity bonuses

## 📁 **Key Files & Directories**

```
hacker-rep/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── auth/github/          # GitHub OAuth
│   │   ├── self/                 # Self Protocol integration
│   │   ├── zk-reputation/        # ZK proof generation
│   │   └── votes/                # Voting system
│   ├── self-verify/              # Self Protocol verification page
│   └── setup/                    # Database setup page
├── components/                    # React components
│   ├── ZKOnboarding.tsx          # Main onboarding flow
│   └── pixel/                    # UI components
├── lib/                          # Utility libraries
│   ├── supabase.ts               # Database client
│   ├── zkpdf-integration.ts      # ZK proof generation
│   └── wagmi.ts                  # Wallet integration
├── FIXED_DATABASE_SETUP.sql      # Database schema
└── SETUP_GUIDE.md               # This file
```

## 🧪 **Testing the System**

### **Test Level 1 (ZK Proofs)**
```bash
curl -X POST http://localhost:3000/api/test-level1 \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x...", "testType": "github"}'
```

### **Test Complete System**
```bash
curl -X POST http://localhost:3000/api/test-complete-system \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x...", "testType": "complete"}'
```

## 🚀 **Production Deployment**

### **Vercel Deployment**
1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### **Environment Variables for Production**
```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
# ... other variables same as development
```

## 🔍 **Troubleshooting**

### **Common Issues**

1. **Database Connection Error**
   - Check Supabase URL and keys
   - Ensure database schema is set up
   - Visit `/setup` page to test connection

2. **GitHub OAuth Error**
   - Verify callback URL matches exactly
   - Check GitHub OAuth app settings
   - Ensure environment variables are set

3. **Wallet Connection Issues**
   - Check WalletConnect Project ID
   - Ensure wallet is supported by RainbowKit
   - Try different wallet providers

4. **Self Protocol QR Code Not Loading**
   - Check Self Protocol endpoint configuration
   - Ensure mobile device has Self Protocol app
   - Verify network connectivity

### **Debug Mode**
Add `?debug=true` to any URL to see detailed logs in browser console.

## 📚 **API Documentation**

### **Core Endpoints**

- `GET /api/users` - List all users
- `POST /api/users/register` - Register new user
- `POST /api/zk-reputation` - Generate ZK proofs
- `POST /api/self/verify` - Self Protocol verification
- `POST /api/votes` - Submit votes
- `GET /api/leaderboard` - View leaderboard

### **Authentication**
- GitHub OAuth: `/api/auth/github`
- Self Protocol: `/self-verify`

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is open source. See LICENSE file for details.

## 🆘 **Support**

- Check the troubleshooting section above
- Open an issue on GitHub
- Join our Discord community

---

**Happy Hacking! 🚀**

*Built for ETHGlobal New Delhi 2024*

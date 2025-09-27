# 🔒 HackerRep: Zero-Knowledge Reputation Protocol

> **Privacy-First Reputation System • Zero-Knowledge Verified Credentials**

![HackerRep Logo](public/hacker-rep-logo.png)

HackerRep is a revolutionary privacy-preserving reputation system that allows developers and hackers to build verifiable credentials without revealing sensitive personal information. Using cutting-edge **zkPDF technology**, users can prove their skills, education, and experience through zero-knowledge proofs.

## 🎯 Project Vision

Transform how reputation is built and verified in the developer community by:
- **Privacy-First**: Never expose personal details while proving credentials
- **Verifiable**: Cryptographically prove skills without revealing source documents  
- **Decentralized**: ENS integration for web3-native identity
- **Social**: Peer voting system for community-driven reputation

## ⚡ Core Features

### 🔐 **Phase 1: Zero-Knowledge Credential System** *(COMPLETE)*

#### **Academic Verification**
- Upload degree certificates and academic documents
- Generate zkPDF proofs to verify education without revealing personal details
- **Scoring**: 0-300 points based on degree level and certifications
- **Privacy**: Student names, addresses, and sensitive data remain hidden

#### **GitHub Skills Verification** 
- Connect GitHub account via OAuth integration
- Generate zkPDF proofs of repository activity and contributions
- **Scoring**: 0-200 points based on repository quality and activity
- **Privacy**: Repository content and private information protected

#### **Reputation Tiers**
- **Newcomer** (0 points): Just getting started
- **Student** (50-149 points): Basic credentials verified
- **Developer** (150-299 points): Solid development skills
- **Senior Developer** (300-499 points): Experienced professional
- **Blockchain Expert** (500+ points): Elite tier recognition

#### **Level System**
- **Level 0: Newcomer** - No zkPDF proofs generated
- **Level 1: ZK Verified** - At least 50 points from zkPDF proofs ✅

### 🗳️ **Phase 2: Social Reputation Layer** *(IN DEVELOPMENT)*

#### **Peer Voting System**
- Community members can upvote/downvote each other
- **Self Protocol Integration**: Advanced social reputation mechanics
- Vote-based reputation modifiers on top of zkPDF base scores
- **Anti-gaming**: Sophisticated mechanisms to prevent manipulation

#### **Enhanced Features**
- Real-time activity feed of ZK proof generation
- ENS-based leaderboards with wallet fallback
- Social reputation combines with zkPDF scores
- Advanced analytics and reputation tracking

## 🚀 Technology Stack

### **Frontend**
- **Next.js 14.2.16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with custom pixel theme
- **RainbowKit + Wagmi** - Web3 wallet integration
- **Pixel UI Design** - Retro gaming aesthetic with modern UX

### **Backend & Database**
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Next.js API Routes** - Serverless API endpoints
- **GitHub OAuth** - Secure repository access

### **Zero-Knowledge Technology**
- **[zkPDF Library](https://privacy-ethereum.github.io/zkpdf/docs/introduction.html)** - Official circuit implementation
- **Noble Crypto Libraries** - Cryptographic primitives
- **PDF Processing** - Secure document parsing and verification

### **Blockchain Integration**
- **Ethereum** - Primary network support
- **ENS (Ethereum Name Service)** - Decentralized identity
- **Web3 Wallet Support** - MetaMask, WalletConnect, and more

## 🎮 User Journey

### **1. Connect Wallet**
```
User connects Ethereum wallet → Auto-registration → Profile created
```

### **2. Generate ZK Credentials**
```
Upload Academic Documents → Generate zkPDF Proof → Earn 50-300 points
Connect GitHub Account → Generate zkPDF Proof → Earn 0-200 points
```

### **3. Build Reputation**
```
Reach Level 1 (50+ points) → Unlock social features → Earn peer votes
```

### **4. Climb Leaderboard** 
```
Increase reputation → Higher tier → Better ENS recognition → Community status
```

## 🔍 Zero-Knowledge Proof System

### **Academic Credentials**
1. **Upload**: User uploads degree/certification PDFs
2. **Parse**: System extracts relevant data (institution, degree type, etc.)
3. **Generate**: zkPDF circuit creates zero-knowledge proof
4. **Verify**: Proof validates credentials without exposing personal data
5. **Store**: Commitment and nullifier stored on-chain/database

### **Privacy Guarantees**
- ✅ **Student names and personal info** → Hidden via ZK commitments
- ✅ **Repository contents** → Only activity patterns proven
- ✅ **Document contents** → Only relevant credentials verified
- ✅ **Nullifiers** → Prevent proof reuse and double-spending

## 🛠️ Development Setup

### **Prerequisites**
- Node.js 18+ 
- pnpm or npm
- Supabase account
- GitHub OAuth App

### **Installation**
```bash
# Clone repository
git clone https://github.com/devhb1/HackerRep.git
cd HackerRep

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase and GitHub credentials

# Run development server
pnpm dev
```

## 🎯 Roadmap

### ✅ **Phase 1: ZK Credential Foundation** *(COMPLETE)*
- [x] zkPDF academic proof generation
- [x] GitHub skill verification  
- [x] Reputation scoring system
- [x] Tier-based progression
- [x] ENS integration
- [x] Leaderboard system

### 🔄 **Phase 2: Social Reputation Layer** *(IN PROGRESS)*
- [ ] Peer voting system implementation
- [ ] Self Protocol integration
- [ ] Advanced anti-gaming mechanisms
- [ ] Enhanced activity feeds
- [ ] Social analytics dashboard

## 🏆 Live Demo

**🌐 Production**: [https://hacker-rep.vercel.app](https://hacker-rep.vercel.app)

### **Try It Out**
1. Connect your Ethereum wallet
2. Upload an academic document or connect GitHub
3. Generate your first zkPDF proof
4. See your reputation score and tier
5. Explore the leaderboard

## 🤝 Contributing

We welcome contributions to HackerRep! Here's how to get involved:

### **Development**
```bash
# Fork the repository
# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Add amazing feature"

# Push and create Pull Request  
git push origin feature/amazing-feature
```

### **Areas for Contribution**
- 🔐 **zkPDF Integration**: Enhance proof generation
- 🎨 **UI/UX**: Improve pixel design and user experience  
- 🧠 **Algorithm**: Reputation scoring improvements
- 🔒 **Security**: Audit smart contracts and proofs
- 📚 **Documentation**: Improve guides and tutorials

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🛡️ Security

### **Security Features**
- zkPDF proofs prevent credential forgery
- Nullifiers prevent proof reuse
- OAuth integration secures GitHub access
- Environment variable protection
- Input validation and sanitization

## 🙏 Acknowledgments

- **[zkPDF Team](https://privacy-ethereum.github.io/zkpdf/)** - For the incredible zero-knowledge PDF verification technology
- **Ethereum Foundation** - For supporting privacy-preserving technologies
- **Supabase** - For the excellent database and API infrastructure
- **Vercel** - For seamless deployment and hosting
- **Open Source Community** - For the amazing tools and libraries

---

<div align="center">

**🔒 Privacy-First Reputation Protocol • ⚡ Powered by zkPDF Technology**

Made with  🔥 by the Devhb

[Website](https://hacker-rep.vercel.app) • [GitHub](https://github.com/devhb1/HackerRep) • [Contact](mailto:hello@hackerrep.dev)

</div>
 
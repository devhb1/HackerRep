# 🚀 **HackerRep: Zero-Knowledge Reputation Protocol**

**ETHGlobal New Delhi 2024 Submission**

> **Building trust for developers through privacy-preserving identity verification and intelligent voting mechanics. Finally, a reputation system that respects your privacy while fostering genuine collaboration.**

---

## 🌟 **Why HackerRep?**

### **The Problem**
Developer reputation today is broken. Your GitHub stars don't translate to real opportunities, your credentials are scattered across platforms, and there's no way to prove your skills without compromising privacy. Plus, traditional systems ignore cultural context and offer zero monetization.

### **Our Solution**
HackerRep fixes this with three key innovations:

**🔐 Privacy-First Identity**:
- **Zero-Knowledge Credentials**: Prove qualifications without exposing documents
- **Selective Disclosure**: Share only necessary demographic markers
- **On-Chain Verification**: Tamper-proof reputation without personal data exposure

**🌍 Cultural Intelligence**:
- **Regional Focus**: Indian nationality requirement for authentic local ecosystem
- **Mentorship Incentives**: Age-based voting power encourages senior-junior guidance
- **Gender Diversity**: 2× voting power for cross-gender interactions promotes inclusion

**💰 Monetizable Reputation**:
- **Boosted Paid Voting**: Users can pay to amplify their votes (receivers get share)
- **Reputation Staking**: Stake reputation for higher voting power
- **Skill Verification Marketplace**: Monetize verified credentials and expertise
- **Mentorship Rewards**: Earn tokens for guiding junior developers

### **🎮 Core Use Cases & Value Creation**

#### **1. 🎓 Academic & Professional Verification**
```typescript
// zkPDF Integration for Credential Verification
const verifyDegree = async (degreePDF) => {
    const zkProof = await generateZKProof(degreePDF, {
        extractFields: ['university', 'degree', 'graduation_year'],
        preservePrivacy: true
    });
    // Earn reputation points without exposing transcript details
    return { reputationBoost: 150, verificationLevel: 'Academic' };
};
```
**Value**: Universities, employers, and clients can verify qualifications instantly without accessing sensitive documents.

#### **2. 🗳️ Culturally-Intelligent Voting System**
```typescript
// Advanced Voting Power Calculation
const calculateVotingPower = (voter, target) => {
    let power = 10; // Base power
    
    // Age-based mentorship incentives
    if (voter.age > target.age + 5) power = 15; // Senior mentoring junior
    if (voter.age < target.age - 5) power = 7;  // Junior feedback to senior
    
    // Cross-gender collaboration bonus
    if (voter.gender !== target.gender) power *= 2;
    
    return power; // Range: 7-30 points
};
```
**Value**: Creates natural mentorship dynamics and promotes gender diversity in tech communities.

#### **3. 💰 Monetizable Reputation Economy**
```typescript
// Boosted Paid Voting System (Future Implementation)
const submitBoostedVote = async (voterWallet, targetWallet, paymentAmount) => {
    const basePower = calculateVotingPower(voter, target);
    const boostedPower = basePower * (1 + paymentAmount / 100); // Payment amplifies vote
    
    // Revenue sharing: 70% to receiver, 20% to protocol, 10% to validators
    const receiverShare = paymentAmount * 0.7;
    const protocolFee = paymentAmount * 0.2;
    const validatorReward = paymentAmount * 0.1;
    
    return { votingPower: boostedPower, earnings: receiverShare };
};
```
**Value**: Developers can monetize their reputation while voters can amplify important endorsements.

### **🚀 Future Implementation Roadmap**

#### **Phase 1: Enhanced Monetization (Q1 2025)**
- **💸 Boosted Paid Voting**: Pay to amplify votes, receivers earn revenue share
- **🎯 Reputation Staking**: Stake reputation tokens for higher voting power
- **💎 Premium Verification**: Fast-track verification for professional credentials
- **🏆 Achievement NFTs**: Mint reputation milestones as tradeable NFTs

#### **Phase 2: Marketplace Expansion (Q2 2025)**
- **🛒 Skill Verification Marketplace**: Sell verified expertise to clients
- **👨‍🏫 Mentorship Platform**: Paid mentoring with reputation-based matching
- **🤝 Collaboration Matching**: AI-powered team formation based on complementary skills
- **📊 Reputation Analytics**: Advanced insights and portfolio management

#### **Phase 3: Multi-Regional Scaling (Q3 2025)**
- **🌏 Regional Expansion**: Support for other countries/regions with localized voting
- **🏢 Enterprise Integration**: Corporate reputation systems for HR and talent acquisition
- **🎓 University Partnerships**: Direct integration with academic institutions
- **🌐 Cross-Chain Reputation**: Reputation portability across multiple blockchains

#### **Phase 4: Advanced Social Features (Q4 2025)**
- **🎮 Gamification Layer**: Reputation-based challenges and competitions
- **🏘️ Community Governance**: Reputation-weighted voting for platform decisions
- **📱 Mobile App**: Native mobile experience with NFC verification
- **🤖 AI Reputation Assistant**: Personalized career guidance based on reputation data

### **💡 Expandable Use Cases**

**🏥 Healthcare**: Verify medical credentials while preserving patient privacy
**🏛️ Government**: Citizen reputation for public service allocation
**🎓 Education**: Student achievement verification across institutions
**💼 Corporate**: Employee skill verification and internal reputation systems
**🏪 E-commerce**: Seller reputation with privacy-preserving transaction history
**🎨 Creative Industries**: Artist/creator reputation with portfolio verification

## 🏆 **Hackathon Tracks Integration**

*The following sections demonstrate how our real-world vision is implemented through cutting-edge Web3 technologies, targeting three major hackathon tracks with a total prize pool of $20,500.*

### **🎯 Self Protocol - Best Self Onchain SDK Integration ($9,000 Prize Pool)**

#### **🏆 Advanced Implementation Beyond Basic Verification**

**✅ Full Self Protocol Onchain SDK Integration** on Celo Mainnet
- **Custom Smart Contract**: `HackerRepSelfVerification.sol` deployed at `0xF54C11EbC39905dd88496E098CDEeC565F79a696`
- **Contract Verification**: Verified on Celoscan with full source code transparency

**✅ Innovative Demographic Data Utilization**
- **Real ZK Proof Verification**: Extracts `nationality`, `gender`, and `age` from Aadhaar/Passport proofs
- **Multi-Layer Data Usage**: Each demographic field serves a unique purpose in our voting algorithm
- **Privacy-Preserving Extraction**: Only essential demographic markers stored on-chain

**✅ Advanced Use Case - Culturally-Aware Voting System**
```solidity
// Custom verification hook extracts demographic data
function customVerificationHook(
    ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
    bytes memory userData
) internal override {
    // Extract nationality for voting eligibility
    string memory nationality = extractNationality(output.disclosedData);
    
    // Extract age for seniority-based voting power
    uint256 age = extractAge(output.disclosedData);
    
    // Extract gender for cross-gender collaboration incentives
    string memory gender = extractGender(output.disclosedData);
    
    // Store demographics for advanced voting logic
    userDemographics[user] = UserDemographics({
        nationality: nationality,
        gender: gender,
        age: age,
        isVerified: true,
        verifiedAt: block.timestamp
    });
}
```

**✅ Technical Excellence**
- **Event Listeners**: Real-time synchronization between contract and backend
- **Robust Architecture**: Polling-based event system handles network instability
- **Production Deployment**: Live on Celo mainnet with comprehensive testing

**🎯 Why This Wins the Self Protocol Track:**

**🏆 Technical Excellence:**
1. **Advanced SDK Integration**: Custom `HackerRepSelfVerification` contract with sophisticated demographic extraction
2. **Production Deployment**: Live on Celo mainnet with verified contract code
3. **Robust Architecture**: Event listeners, polling systems, and real-time synchronization
4. **Aadhaar Support**: Full support for India's national ID system (newly launched by Self Protocol)

**💡 Innovation Beyond Basic Verification:**
1. **Multi-Purpose Data Usage**: Each demographic field (nationality, age, gender) serves unique algorithmic purposes
2. **Cultural Intelligence**: First blockchain reputation system with nationality-aware mechanics
3. **Social Engineering**: Uses ZK-verified demographics to solve real diversity/mentorship problems
4. **Scalable Framework**: Can be extended to other regions and use cases

**🌍 Real-World Impact:**
1. **Addresses Gender Gap**: Actively incentivizes male-female professional interactions in tech
2. **Promotes Mentorship**: Age-based voting power creates natural senior-junior guidance
3. **Prevents Sybil Attacks**: ZK verification ensures authentic demographic data
4. **Local Ecosystem Focus**: Indian nationality requirement builds genuine regional developer community

**🔬 Technical Depth:**
- **Custom Solidity Implementation**: Not just using basic Self SDK - built sophisticated extraction logic
- **Privacy-Preserving**: Only extracts essential demographic markers, no personal data
- **Event-Driven Architecture**: Real-time contract-to-database synchronization
- **Production Testing**: Comprehensive testing across all voting scenarios with real demographic data

### **🔬 Ethereum Foundation - Best Infrastructure on Client-Side Privacy ($1,500 Prize Pool)**

#### **🏆 zkPDF Integration for Academic & Professional Credential Verification**

**✅ zkPDF Stack Integration for ZK Proof Generation**
- **Academic Credential Verification**: Users upload degree certificates, transcripts as PDFs
- **Professional License Proofs**: Generate ZK proofs from professional certifications
- **Client-Side Privacy**: All proof generation happens without exposing document contents
- **Remote Proving**: Utilizes zkPDF prover network - no full server deployment required

**✅ Unified ZK Registry System Implementation**
```typescript
// Unified credential verification across multiple document types
const generateZKProof = async (documentType: 'degree' | 'certification' | 'transcript') => {
    // zkPDF integration for document proof generation
    const zkProof = await zkPDFProver.generateProof({
        document: uploadedPDF,
        proofType: documentType,
        extractFields: ['institution', 'degree', 'graduation_year'],
        preservePrivacy: true // Only extract necessary fields
    });
    
    // Store ZK proof hash on-chain for verification
    await updateUserCredentials(walletAddress, {
        [`${documentType}_proof`]: zkProof.proofHash,
        [`${documentType}_score`]: calculateCredentialScore(zkProof.extractedData)
    });
};
```

**✅ Multi-Format Document Support**
- **PDF Certificates**: Degree certificates, professional licenses
- **Academic Transcripts**: Grade verification without exposing specific courses
- **Professional Certifications**: Industry certifications (AWS, Google Cloud, etc.)
- **Unified Scoring**: All document types contribute to unified reputation score

**🎯 Why This Wins the Ethereum Foundation Track:**

**🔧 Infrastructure Excellence:**
1. **Client-Side Privacy**: All sensitive document processing happens locally
2. **Unified Registry**: Single system handles degrees, certifications, transcripts
3. **zkPDF Integration**: Proper use of zkPDF stack without server deployment
4. **Scalable Architecture**: Can handle multiple document formats and institutions

**🛡️ Privacy Innovation:**
1. **Selective Disclosure**: Only extract necessary fields (institution, degree type, year)
2. **Document Privacy**: Original PDFs never leave user's device
3. **ZK Proof Verification**: On-chain verification without exposing document contents
4. **Professional Qualification Sharing**: Prove credentials without revealing sensitive details

**🌐 Real-World Application:**
1. **Academic Verification**: Universities can verify degrees without accessing full transcripts
2. **Professional Licensing**: Employers verify certifications without seeing personal details
3. **Reputation Building**: Academic achievements contribute to blockchain reputation
4. **Anti-Fraud**: ZK proofs prevent fake credential claims

### **🌐 ENS - Most Creative Use of ENS ($10,000 Prize Pool)**
- ✅ **ENS-First User Experience**: Primary identity system throughout the platform
- ✅ **Dynamic ENS Resolution**: Automatic ENS name fetching and display prioritization
- ✅ **ENS-Based Search**: Users can search by ENS names across the platform
- ✅ **Portable Identity**: ENS names carry reputation across different features
- ✅ **Social Layer**: ENS integration in voting, leaderboards, and connections
- ✅ **Fallback System**: Graceful degradation to wallet addresses when ENS unavailable

---

## 🎯 **Technical Implementation Overview**

HackerRep is a **Multi-Track Advanced Reputation System** that transforms the vision above into reality through:

### **🔧 Three-Layer Architecture**

**🏗️ Layer 1 - Privacy-Preserving Credentials (Ethereum Foundation Track)**:
- **zkPDF Integration**: Generate ZK proofs from academic PDFs without exposing sensitive data
- **Unified Registry**: Single system for degrees, certifications, professional licenses
- **Client-Side Privacy**: Document processing happens locally, only proof hashes stored on-chain

**🛡️ Layer 2 - Cultural Intelligence Engine (Self Protocol Track)**:
- **Demographic Extraction**: ZK-verified nationality, age, gender from Aadhaar/Passport
- **Voting Eligibility**: Indian nationality requirement creates authentic regional ecosystem
- **Social Mechanics**: Age and gender data power sophisticated voting algorithms

**🌐 Layer 3 - Decentralized Identity & Monetization (ENS Track)**:
- **ENS-First Architecture**: Reputation tied to human-readable names, not wallet addresses
- **Monetizable Voting**: Future paid voting system with revenue sharing
- **Portable Reputation**: Identity and achievements follow ENS names across platforms

### **💡 The Innovation: Synergistic Integration**

Unlike projects that implement single features, HackerRep creates **synergistic value** where each layer enhances the others:

```typescript
// Example: Complete User Verification Flow
const completeVerification = async (user) => {
    // Layer 1: Verify academic credentials with zkPDF
    const academicProof = await verifyDegree(user.degreePDF);
    
    // Layer 2: Extract demographics with Self Protocol
    const demographics = await selfVerify(user.aadhaarProof);
    
    // Layer 3: Create ENS-based reputation profile
    const reputationProfile = await createENSProfile({
        ensName: user.ensName,
        academicScore: academicProof.score,
        demographics: demographics,
        votingPower: calculateInitialVotingPower(demographics)
    });
    
    return reputationProfile; // Complete, verifiable, monetizable identity
};
```

**🎯 Result**: A developer can prove their IIT degree (Layer 1), verify their Indian nationality and demographics (Layer 2), and build a monetizable reputation under their ENS name (Layer 3) - all while preserving privacy and preventing gaming.

### **🔥 Key Innovation: Demographic-Aware Voting Power System**

#### **🧠 The Science Behind Our Voting Algorithm**

Our **revolutionary voting system** leverages Self Protocol's verified demographic data to create a culturally-intelligent reputation mechanism:

**🎯 Core Innovation: Three-Tier Demographic Utilization**

**1. 🇮🇳 Nationality as Gatekeeper (Eligibility Layer)**
```typescript
// Only Indian developers can vote - ensures cultural authenticity
const canVote = user.nationality === 'INDIA' && user.self_verified === true;
```
- **Purpose**: Creates focused Indian developer ecosystem
- **Benefit**: Prevents vote manipulation from outside regions
- **Hackathon Relevance**: ETHGlobal New Delhi - local developer focus

**2. 👥 Age as Seniority Indicator (Power Calculation Layer)**
```typescript
// Age difference > 5 years creates mentor-mentee dynamics
if (Math.abs(voterAge - votedForAge) > 5) {
    const seniorPower = 15; // Experienced developers
    const juniorPower = 7;  // Emerging developers
    // Respects experience while empowering newcomers
}
```
- **Purpose**: Natural mentorship hierarchy in tech community
- **Benefit**: Senior developers' endorsements carry more weight
- **Innovation**: Balances experience with fresh perspectives

**3. ⚖️ Gender as Diversity Catalyst (Multiplier Layer)**
```typescript
// Cross-gender voting gets 2× power - promotes inclusion
if (voterGender !== votedForGender && bothAreVerified) {
    finalVotingPower *= 2; // Incentivizes diverse collaboration
}
```
- **Purpose**: Actively promotes gender diversity in tech
- **Benefit**: Male-female professional interactions get amplified
- **Social Impact**: Addresses gender imbalance in blockchain/tech

**🏆 Unique Voting Power Combinations:**
- **Senior Male → Junior Female**: 30 points (15 × 2) - Maximum mentorship impact
- **Junior Female → Senior Male**: 14 points (7 × 2) - Empowered reverse feedback  
- **Same Gender, Age Advantage**: 15 points - Traditional seniority respect
- **Cross-Gender, Similar Age**: 20 points (10 × 2) - Peer collaboration bonus
- **Similar Demographics**: 10 points - Base democratic power

**🎯 Real-World Benefits:**
1. **Mentorship Incentives**: Senior developers encouraged to guide juniors
2. **Gender Inclusion**: Cross-gender interactions actively rewarded
3. **Cultural Authenticity**: Indian nationality ensures genuine local participation
4. **Anti-Gaming**: ZK verification prevents demographic spoofing
5. **Balanced Power**: No single demographic dominates the system

---

## 🏗️ **Architecture & Technical Implementation**

### **Smart Contract Integration (Self Protocol)**
```solidity
// HackerRepSelfVerification.sol - Custom Self Protocol Integration
contract HackerRepSelfVerification is SelfVerificationRoot {
    struct UserDemographics {
        string nationality;
        string gender;
        uint256 age;
        bool isVerified;
        uint256 verifiedAt;
    }
    
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) internal override {
        // Extract real demographic data from ZK proof
        // Store on-chain for voting power calculations
    }
}
```

**Contract Address**: `0xF54C11EbC39905dd88496E098CDEeC565F79a696` (Celo Mainnet)

### **Advanced Voting Power Algorithm**
```typescript
function calculateVotingPower(
    voterAge: number,
    voterReputation: number, 
    voterGender: string,
    votedForAge: number,
    votedForReputation: number,
    votedForGender: string
): { power: number, breakdown: string } {
    let basePower = 10;
    
    // Age/reputation advantage system
    const ageDiff = Math.abs(voterAge - votedForAge);
    const repDiff = Math.abs(voterReputation - votedForReputation);
    
    if (repDiff > 50) {
        basePower = voterReputation > votedForReputation ? 15 : 7;
    } else if (ageDiff > 5) {
        basePower = voterAge > votedForAge ? 15 : 7;
    }
    
    // Cross-gender 2x multiplier
    const isCrossGender = voterGender !== votedForGender && 
                         ['MALE', 'FEMALE'].includes(voterGender) &&
                         ['MALE', 'FEMALE'].includes(votedForGender);
    
    return {
        power: isCrossGender ? basePower * 2 : basePower,
        breakdown: `${basePower}${isCrossGender ? ' × 2 cross-gender' : ''}`
    };
}
```

---

## 🌟 **Core Features**

### **🔐 Self Protocol Integration - Advanced Demographic Data Utilization**

#### **🎯 Innovative Use of Self Protocol's ZK Proof System**

Our implementation goes **far beyond basic identity verification** - we extract and utilize demographic data from Self Protocol's ZK proofs to create a sophisticated, culturally-aware reputation system:

**🔍 Data Extraction Process:**
1. **Aadhaar/Passport ZK Verification**: Users scan QR code with Self app
2. **On-chain Proof Verification**: Custom `HackerRepSelfVerification` contract validates ZK proof
3. **Demographic Data Extraction**: Contract extracts `nationality`, `gender`, and `age` from verified proof
4. **Privacy Preservation**: Only essential demographic markers stored - no personal identifiers

**🇮🇳 Nationality as Voting Eligibility Barrier:**
- **Indian-Only Voting**: Only users with verified `nationality: "INDIA"` can cast votes
- **Sybil Resistance**: Self Protocol's ZK verification prevents fake nationality claims  
- **Cultural Context**: Focuses on Indian developer ecosystem for hackathon relevance
- **Scalable Framework**: Can be extended to other regions/nationalities

**⚡ Age & Gender for Advanced Voting Mechanics:**

**Age-Based Seniority System:**
```typescript
// Age difference creates natural mentorship hierarchy
if (Math.abs(voterAge - votedForAge) > 5) {
    // Senior developers (higher age) get 15 voting power
    // Junior developers (lower age) get 7 voting power
    // Creates respect for experience while empowering newcomers
}
```

**Cross-Gender Collaboration Incentives:**
```typescript
// 2× voting power for male-female interactions
if (voterGender !== votedForGender && 
    ['MALE', 'FEMALE'].includes(voterGender)) {
    votingPower *= 2; // Encourages diverse collaboration
}
```

**🏆 Unique Benefits This Provides:**

1. **Cultural Authenticity**: Indian nationality requirement ensures genuine local developer participation
2. **Mentorship Incentives**: Age-based voting power encourages senior-junior interactions
3. **Gender Diversity**: Cross-gender voting bonus promotes inclusive developer communities
4. **Anti-Gaming**: ZK verification prevents demographic spoofing
5. **Privacy-First**: Demographic data extracted without exposing personal information

### **🗳️ Advanced Voting System**
- **Dynamic Power Calculation**: Voting strength based on age, reputation, and gender differences
- **Cross-Gender Incentives**: 2× voting power for male-female interactions
- **Seniority Advantages**: Age and reputation differences create voting hierarchies  
- **Permanent Impact**: All votes permanently affect reputation scores
- **Anti-Gaming**: Self Protocol verification prevents sybil attacks

### **🏆 Multi-Level Leaderboards**
- **Level 1**: Basic ZK-verified reputation (GitHub + Academic)
- **Level 3**: Self Protocol verified users with voting-based rankings
- **ENS Integration**: Primary display names with fallback to wallet addresses
- **Real-time Updates**: Leaderboards reflect voting activity immediately

### **🌐 ENS-First Experience**
- **Primary Identity**: ENS names prioritized throughout platform
- **Search Integration**: Find users by ENS names
- **Social Features**: ENS-based connections and interactions
- **Portable Reputation**: Identity and reputation tied to ENS names

---

## 🎮 **User Journey**

### **Phase 1: Basic Onboarding**
1. Connect wallet and register
2. Link GitHub for code reputation
3. Add academic credentials
4. Generate Level 1 ZK-verified reputation

### **Phase 2: Self Protocol Verification** 
1. Click "Self Verify" in dashboard
2. Scan QR code with Self app
3. Complete Aadhaar/Passport verification
4. Demographic data extracted and stored on-chain
5. Voting eligibility activated (Indian nationality required)

### **Phase 3: Advanced Voting**
1. Browse leaderboard of verified users
2. Vote with calculated power based on demographics
3. Reputation permanently updated
4. Rankings reflect voting-based reputation

---

## 🛠️ **Technical Stack**

### **Frontend**
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Wagmi** for wallet integration
- **ENS SDK** for name resolution

### **Backend**
- **Next.js API Routes**
- **Supabase** PostgreSQL database
- **Real-time Event Listeners** for contract synchronization

### **Blockchain & ZK Infrastructure**
- **Celo Mainnet** deployment
- **Self Protocol SDK** for demographic ZK verification
- **zkPDF Stack** for academic credential proof generation
- **Custom Solidity Contract** for demographic data handling
- **Foundry** for contract development and deployment
- **Remote Proving Network** for client-side privacy

---

## 📊 **Hackathon Track Achievements**

### **🔬 Ethereum Foundation Track Requirements** ✅
- [x] **zkPDF Integration** - Unified ZK registry system for academic credentials
- [x] **Client-Side Privacy** - Document processing without server deployment
- [x] **Remote Proving** - Utilizes zkPDF prover network for ZK proof generation
- [x] **Multi-Format Support** - Handles degrees, certifications, transcripts
- [x] **Privacy Infrastructure** - Selective disclosure without exposing document contents

### **🎯 Self Protocol Track Requirements** ✅
- [x] **Implement Self onchain SDK** - Custom contract deployed on Celo mainnet
- [x] **Proof needs to work** - Full ZK verification flow functional
- [x] **Interesting use case** - Advanced voting power based on demographic data
- [x] **Aadhaar support** - Supports both Passport and Aadhaar verification
- [x] **Privacy preservation** - Only necessary demographic data extracted

### **🌐 ENS Track Requirements** ✅  
- [x] **Creative ENS integration** - ENS-first identity system with social features
- [x] **Obvious product improvement** - ENS makes user experience significantly better
- [x] **Functional demo** - Full working implementation, not hardcoded values
- [x] **Open source code** - Complete codebase available on GitHub

---

## 🚀 **Live Demo & Deployment**

### **Contract Addresses**
- **HackerRepSelfVerification**: `0xF54C11EbC39905dd88496E098CDEeC565F79a696` (Celo Mainnet)
- **Verified on Celoscan**: ✅ Contract verification complete

### **API Endpoints**
- **Level 3 Leaderboard**: `/api/leaderboard-level3`
- **Voting System**: `/api/votes`
- **Self Verification Sync**: `/api/self/sync-verification`
- **ENS User Search**: `/api/users/search`

---

## 🧪 **Testing & Validation**

### **Comprehensive Test Results**
```bash
✅ Cross-gender age disadvantage: 14 points (7 × 2)
✅ Cross-gender age advantage: 30 points (15 × 2)  
✅ Same gender age advantage: 15 points
✅ Base power cross-gender: 20 points (10 × 2)
✅ Reputation permanently affected by votes
✅ Leaderboard correctly ranks by voting-based reputation
```

### **System Verification**
- ✅ 9 Self Protocol verified users in system
- ✅ Contract accessible and functional on Celo mainnet
- ✅ All API endpoints responding correctly
- ✅ ENS integration working across platform
- ✅ Event listeners synchronizing contract data

---

## 🎯 **Innovation Highlights**

### **Technical Innovation**
1. **Custom Self Protocol Integration**: Beyond basic verification - extracts and uses demographic data for advanced logic
2. **Sophisticated Voting Algorithm**: Multi-factor power calculation with cross-gender incentives
3. **Real-time Contract Synchronization**: Polling-based event listeners for robust data sync
4. **ENS-First Architecture**: Identity system built around ENS names with graceful fallbacks

### **Social Innovation**
1. **Cross-Gender Collaboration Incentives**: 2× voting power encourages diverse interactions
2. **Seniority-Based Hierarchy**: Age and reputation create natural mentorship dynamics
3. **Privacy-Preserving Demographics**: ZK proofs enable demographic-aware features without privacy loss
4. **Anti-Gaming Mechanisms**: Self Protocol verification prevents sybil attacks

---

## 📱 **Installation & Setup**

### **Prerequisites**
- Node.js 18+ 
- Supabase account
- Self Protocol app (iOS/Android)
- Celo wallet with CELO tokens

### **Environment Setup**
```bash
# Clone repository
git clone https://github.com/devhb1/hackerrep
cd hackerrep

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Add your Supabase URL, API keys, etc.

# Run database migrations
# Execute HACKERREP_COMPLETE_MIGRATION.sql in Supabase dashboard

# Start development server
npm run dev
```

---

## 🏆 **Hackathon Submission Summary**

**HackerRep** represents a **triple-track winning implementation** that showcases advanced Web3 identity and reputation systems:

### **🎯 Three-Track Integration **

**🔬 Ethereum Foundation Track**: 
- **zkPDF-powered credential verification** with unified ZK registry system
- **Client-side privacy infrastructure** for academic and professional documents
- **Remote proving network** integration without server deployment requirements

**🛡️ Self Protocol Track**: 
- **Advanced demographic data extraction** from Aadhaar/Passport ZK proofs
- **Custom on-chain verification contract** with sophisticated social mechanics
- **Cultural intelligence system** using nationality, age, and gender for voting power

**🌐 ENS Track**: 
- **ENS-first identity architecture** with seamless name resolution
- **Social reputation system** built around decentralized naming
- **Portable identity framework** connecting reputation to ENS names





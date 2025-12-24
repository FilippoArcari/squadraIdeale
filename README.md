# ⚽ Squadra Ideale

**Squadra Ideale** is an innovative web application designed to simplify the organization and management of amateur sports tournaments. With intelligent team balancing algorithms, real-time statistics tracking, and an intuitive user interface, Squadra Ideale transforms the way groups organize and enjoy competitive sports.

---

## 🚨 Copyright & Intellectual Property Notice

**© 2025 Filippo. All Rights Reserved.**

> [!CAUTION]
> **This project and its underlying concept, design, and implementation are the proprietary intellectual property of the author.**
>
> This application embodies a unique combination of features, algorithms, and user experience design specifically created for tournament and team management. The innovative approach to automatic team balancing, integrated player statistics tracking, MVP voting systems, and real-time tournament management represents significant creative and technical investment.
>
> **Unauthorized copying, reproduction, distribution, modification, or commercial use of this project's concept, code, algorithms, or design is strictly prohibited without explicit written permission from the author.**
>
> This includes, but is not limited to:
> - Replicating the core idea or business model
> - Copying the team balancing algorithm or statistical tracking system
> - Using the UI/UX design patterns for similar applications
> - Creating derivative works based on this project
>
> For licensing inquiries or permission requests, please contact the author.

---

## 🌟 Features

### 🏆 Tournament Management
- **Create and Organize Tournaments**: Support for soccer (calcio), basketball (basket), and volleyball (volley)
- **Multi-Sport Support**: Customizable game formats and scoring systems
- **Tournament Dashboard**: Centralized view of all active and completed tournaments
- **Participant Management**: Easy player registration and removal
- **Tournament Status Tracking**: Active, completed, and archived tournament states

### 👥 Intelligent Team Balancing
- **Automatic Team Creation**: Advanced algorithm that creates balanced teams based on player ratings
- **Drag-and-Drop Interface**: Intuitive UI for manual team adjustments
- **Real-Time Balance Calculation**: Live feedback on team strength and fairness
- **Player Rating System**: Skill-based rating (0-100) for accurate team composition
- **Public Team Balancer**: Try the team balancing feature without registration

### 📊 Advanced Statistics & Tracking
- **Player Statistics**: Goals, wins, losses, MVP awards, and participation tracking
- **Tournament Leaderboards**: Real-time rankings and standings
- **Game History**: Complete match archive with detailed results
- **MVP Voting System**: Democratic player-voted best performance tracking
- **Performance Analytics**: Individual and team performance metrics

### 🎮 Game Management
- **Live Game Creation**: Generate new games with balanced teams
- **Score Tracking**: Real-time goal and point recording
- **MVP Selection**: Post-game best player voting
- **Match Results**: Automatic winner determination and statistics updates
- **Game Administration**: Edit games, adjust scores, and manage results

### 🔐 User Authentication & Profiles
- **Secure Registration & Login**: Email/password authentication with bcrypt hashing
- **Google OAuth Integration**: One-click sign-in with Google accounts
- **User Profiles**: Personal dashboard with tournament history and statistics
- **Profile Images**: Avatar upload and management via Cloudinary
- **Session Management**: Secure NextAuth.js-based authentication

### 🎨 Premium User Experience
- **Modern UI Design**: Built with DaisyUI components and Tailwind CSS
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Dark Mode Support**: Eye-friendly theme options
- **Smooth Animations**: Engaging micro-interactions and transitions
- **Italian Language**: Native Italian interface and content

### ⚙️ Admin Features
- **Tournament Administration Dashboard**: Manage players, edit ratings, and control games
- **Player Management**: Add/remove players, adjust ratings
- **Game Control**: Edit game details, scores, and results
- **Image Synchronization**: Admin tools for player image management
- **Audit Logging**: Track system changes and user actions

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) - React framework with App Router
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [DaisyUI 5](https://daisyui.com/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)

### Backend
- **API**: Next.js API Routes
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose ODM](https://mongoosejs.com/)
- **Authentication**: [NextAuth.js 4](https://next-auth.js.org/)
- **Image Storage**: [Cloudinary](https://cloudinary.com/)
- **Password Hashing**: [bcryptjs](https://www.npmjs.com/package/bcryptjs)

### Development Tools
- **Linting**: ESLint with Next.js configuration
- **Package Manager**: npm
- **Environment Management**: dotenv

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** account (MongoDB Atlas recommended)
- **Google Cloud Console** account (for OAuth)
- **Cloudinary** account (for image storage)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/squadra_ideale.git
cd squadra_ideale
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory by copying the example:
```bash
cp .env.example .env
```

Configure the following environment variables in your `.env` file:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand-hex-32>

# Google OAuth Credentials
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
```

#### Get Your Credentials

**MongoDB URI:**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string and replace `<username>`, `<password>`, `<cluster>`, and `<database>`

**NextAuth Secret:**
```bash
# Linux/macOS
openssl rand -hex 32

# Or visit https://generate-secret.vercel.app/32
```

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
6. Copy Client ID and Client Secret

**Cloudinary:**
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret from the dashboard

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
squadra_ideale/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── tournaments/          # Tournament CRUD operations
│   │   ├── games/                # Game management
│   │   ├── users/                # User management
│   │   └── ...
│   ├── admin/                    # Admin dashboard
│   ├── balancer/                 # Public team balancer
│   ├── dashboard/                # User dashboard
│   ├── games/                    # Game pages
│   ├── login/                    # Login page
│   ├── profile/                  # User profile
│   ├── register/                 # Registration page
│   ├── tournaments/              # Tournament pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/                   # Reusable React components
│   └── Navbar.tsx
├── hooks/                        # Custom React hooks
│   └── useDragAndDrop.ts         # Drag-and-drop functionality
├── lib/                          # Utility functions
│   ├── balanceTeams.ts           # Team balancing algorithm
│   ├── cloudinary.ts             # Cloudinary configuration
│   ├── dbConnect.ts              # MongoDB connection
│   └── sessionUser.ts            # Session utilities
├── models/                       # Mongoose schemas
│   ├── AuditLog.ts
│   ├── Game.ts
│   ├── Player.ts
│   ├── Tournament.ts
│   └── User.ts
├── scripts/                      # Utility scripts
├── public/                       # Static assets
├── .env.example                  # Environment variables template
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project dependencies
```

---

## 🎯 Usage Guide

### For Organizers

#### Creating a Tournament
1. **Register** or **Login** to your account
2. Navigate to the **Dashboard**
3. Click **"Nuovo Torneo"** (New Tournament)
4. Fill in tournament details (name, sport type, description)
5. Add players with their names and ratings (0-100)
6. Submit to create your tournament

#### Managing a Game
1. Open your tournament from the dashboard
2. Click **"Crea Nuova Partita"** (Create New Game)
3. Select available players
4. The system will automatically balance teams
5. Adjust teams manually if needed (drag-and-drop)
6. Start the game and track scores in real-time
7. Select the winning team and vote for MVP
8. View updated statistics and leaderboards

#### Tournament Administration
1. Open your tournament
2. Click **"Gestisci Torneo"** (Manage Tournament)
3. Edit player ratings, remove players, or adjust game results
4. Deactivate tournament when completed

### For Players

#### Joining a Tournament
1. **Register** or **Login**
2. Request tournament ID from organizer
3. Click **"Entra in un Torneo"** (Join Tournament)
4. Enter tournament ID and join

#### Voting for MVP
1. After a game is completed by the organizer
2. Navigate to the game page
3. Vote for the best player of the match
4. View updated MVP statistics

### For Everyone

#### Try Team Balancer (No Registration Required)
1. Visit the homepage
2. Click **"Prova Subito"** (Try Now)
3. Add player names and ratings
4. Click **"Bilancia Squadre"** (Balance Teams)
5. See intelligently balanced teams

---

## 🔐 Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs before storage
- **Secure Sessions**: NextAuth.js manages secure session tokens
- **CSRF Protection**: Built-in CSRF token validation
- **Environment Variables**: Sensitive credentials stored securely in `.env`
- **MongoDB Connection Security**: Encrypted database connections
- **OAuth Security**: Google OAuth 2.0 implementation with secure callbacks

---

## 🎨 Core Algorithms

### Team Balancing Algorithm

The team balancing algorithm is a proprietary feature that:
1. Calculates total available player strength
2. Targets equal average ratings per team
3. Uses iterative optimization to minimize rating differences
4. Supports flexible team sizes
5. Provides multiple balanced team configurations

**This algorithm is protected intellectual property and may not be replicated or used without permission.**

---

## 🐛 Known Issues & Limitations

- MVP voting is currently limited to one vote per player per game
- Tournament deactivation is irreversible
- Player ratings must be manually updated by organizers
- Image uploads are limited by Cloudinary free tier constraints

---

## 🤝 Contributing

**This is a proprietary project and contributions are not currently accepted.** If you have suggestions or find bugs, please contact the author directly.

---

## 📝 License

**© 2025 Filippo. All Rights Reserved.**

This project is proprietary software. **No license is granted** for use, modification, or distribution without explicit written permission from the author.

For commercial licensing or partnership opportunities, please contact the author.

---

## 📧 Contact

For inquiries regarding:
- Licensing and permissions
- Commercial use proposals
- Technical questions
- Collaboration opportunities

Please contact the project author.

---

## 🙏 Acknowledgments

- **Next.js Team** - For the excellent React framework
- **Vercel** - For deployment infrastructure
- **DaisyUI** - For beautiful UI components
- **MongoDB** - For reliable database services
- **Cloudinary** - For image management solutions

---

## 📊 Project Stats

- **Version**: 0.1.0
- **Status**: Active Development
- **Created**: 2025
- **Language**: Italian 🇮🇹
- **Use Case**: Amateur Sports Tournament Management

---

> [!IMPORTANT]
> **This application represents a unique and innovative solution for sports tournament management. The concept, design, and implementation are protected intellectual property. Respect the author's creative work and rights.**

**Made with ❤️ for sports enthusiasts**

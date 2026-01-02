# 🎁 Advanced Discord Giveaway Bot

A modern, feature-rich Discord Giveaway Bot built with **Node.js**, **Discord.js v14**, and **SQLite**. Fully interaction-based with button controls for seamless user experience.

---

## ✨ Key Features

-   **🎯 Button-Based Interactions**: Modern Discord buttons for all giveaway entries - no reactions needed
-   **⚡ 2x Luck System**: Configure specific roles to receive double probability in winner selection
-   **⏸️ Pause & Resume**: Control entry flow with instant pause/resume functionality
-   **✍️ Live Editing**: Modify prize, duration, or winner count of active giveaways in real-time
-   **💾 Persistent Data**: SQLite database ensures giveaways survive bot restarts and auto-processes expired entries
-   **🎨 Rich Embeds**: Beautiful embeds with server icons and live entry counters
-   **🔍 Flexible Lookup**: Query giveaways using either unique ID or message ID
-   **🛡️ Permission-Based**: All commands require **Manage Guild** permission for security

---

## 🚀 Getting Started

### Prerequisites

-   Node.js 18.0.0 or higher
-   A Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))

### Installation

1.  **Clone or download** the repository
2.  Open your terminal in the project directory
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Configure Environment**:
    Create a `.env` file in the root directory:
    ```env
    DISCORD_TOKEN=your_token_here
    CLIENT_ID=your_client_id_here
    GUILD_ID=your_optional_guild_id_for_dev
    ```

### Running the Bot

-   **Development**: `npm run dev`
-   **Production**: `npm start`

---

## 🛠️ Command Suite

> [!IMPORTANT]
> **All commands require the `Manage Guild` permission to execute.**

| Category | Command | Description |
| :--- | :--- | :--- |
| **Start** | `/giveaway start` | Launch a new giveaway (Max 30 days) |
| **Manage** | `/giveaway list` | View all active and ended giveaways in the server |
| **Manage** | `/giveaway edit` | Modify prize, duration, or winner count of active giveaways |
| **Status** | `/giveaway pause` | Suspend entries for a specific giveaway |
| **Status** | `/giveaway resume` | Allow users to join a paused giveaway again |
| **Control** | `/giveaway end` | Manually stop a giveaway and pick winners immediately |
| **Control** | `/giveaway reroll` | Pick new winners for an already ended giveaway |
| **Review** | `/giveaway info` | Get detailed statistics and status of a giveaway |
| **Cleanup** | `/giveaway delete` | Remove a giveaway and its message from the server |
| **Config** | `/settings boosted-roles` | Assign up to 3 roles that get **2x Luck** |
| **System** | `/help` | Display the interactive help menu |
| **System** | `/ping` | Check bot and API latency |

---

## 🎮 How It Works

1. **Create a Giveaway**: Use `/giveaway start` to launch a new giveaway
2. **Users Join**: Members click the interactive "Join" button to enter
3. **Automatic Ending**: Bot automatically picks winners when time expires
4. **Winner Selection**: Random selection with support for boosted roles (2x chance)
5. **Announcements**: Winners are automatically mentioned with results

---

## ⚙️ Configuration

### Boosted Roles (2x Luck)
Assign up to 3 roles that receive double entry weight:
```
/settings boosted-roles role1:@PremiumMember role2:@VIP
```

### Customization
Edit `src/config/constants.js` to customize:
- Brand name and domain
- Custom emojis
- Color scheme
- Links and footer text

---

## 📊 Technical Details

-   **Framework**: Discord.js v14 with slash commands
-   **Database**: better-sqlite3 for persistent storage
-   **Interactions**: Button-based entry system (no reactions)
-   **Background Tasks**: Automatic giveaway checking every 10 seconds
-   **Privacy**: Ephemeral responses for all management commands

---

## �‍💻 Credits

**Developed by**: [Morpheus Dark](https://discord.com/users/soulbinder9018) (Discord: `soulbinder9018`)

**Organization**: [Miyu Development](https://miyudevelopment.online)

### 🔗 Links
- **Discord Server**: [Join Miyu Development](https://discord.com/invite/TXQ3wnPsSj)
- **Website**: [miyudevelopment.online](https://miyudevelopment.online)

---

## 📝 License

**Copyright © 2026 MorpheusDark7 - All Rights Reserved**

This software is proprietary and confidential. You may:
- ✅ View the source code for educational purposes
- ✅ Use the bot for personal, non-commercial purposes
- ✅ Fork the repository for personal learning

You may **NOT**:
- ❌ Modify and redistribute this software
- ❌ Claim this work as your own
- ❌ Use commercially without permission

See the [LICENSE](LICENSE) file for full terms.

---

> [!NOTE]
> This bot uses the latest Discord API standards, including **MessageFlags.Ephemeral** for enhanced privacy and **Button Components** for modern UX.

*Made with 💜 by Miyu Development*

const TelegramBot = require('node-telegram-bot-api');

// Token & Config Setup
const token = process.env.BOT_TOKEN || '8326505185:AAHpm24kDxWq-4p9Kusl5CsGHhf16BSsHrU';
const bot = new TelegramBot(token, { polling: true });

const ownerName = "Bagga Sher MD";
const botName = "Love MD Telegram Bot";
const ownerId = 8326505185; 
const channelUsername = "@LoveMDBotChannel";
const channelLink = "https://t.me/LoveMDBotChannel";

const activeUsers = new Set();

// Channel Join Checker
async function checkChannelMember(userId) {
    try {
        const member = await bot.getChatMember(channelUsername, userId);
        return ['creator', 'administrator', 'member'].includes(member.status);
    } catch (e) {
        return true; 
    }
}

// /start Command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    activeUsers.add(chatId);

    const isMember = await checkChannelMember(userId);

    if (!isMember) {
        return bot.sendMessage(chatId, `⚠️ *Access Restricted!*\n\n*${botName}* ko use karne ke liye official channel join karein.`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📢 Join Official Channel', url: channelLink }],
                    [{ text: '✅ Verify Joining', callback_data: 'check_join' }]
                ]
            }
        });
    }

    const welcomeMsg = `🔥 *Welcome to ${botName}* 🔥\n\n👑 *Developer:* ${ownerName}\n⚡ *Status:* Active & Online\n\nSelect an option below:`;
    
    bot.sendMessage(chatId, welcomeMsg, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '📜 Commands Menu', callback_data: 'cmd_help' },
                    { text: '🛡️ Admin Tools', callback_data: 'cmd_admintools' }
                ],
                [
                    { text: '🚀 Speed Test', callback_data: 'cmd_ping' },
                    { text: '📊 Stats', callback_data: 'cmd_stats' }
                ],
                [
                    { text: '📢 Official Channel', url: channelLink }
                ]
            ]
        }
    });
});

// Callback Buttons Query
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;

    if (data === 'check_join') {
        const isMember = await checkChannelMember(userId);
        if (isMember) {
            bot.sendMessage(chatId, "🎉 *Verification Success!* Type /start again.", { parse_mode: 'Markdown' });
        } else {
            bot.answerCallbackQuery(query.id, { text: "❌ Pehle channel join karein!", show_alert: true });
        }
    } else if (data === 'cmd_help') {
        const helpText = `📌 *Commands List:*\n\n/start - Start Bot\n/ping - Speed Check\n/id - View ID Details\n/owner - Developer Details\n/stats - User Counter\n/time - Server Time\n/say <text> - Echo Text\n/ban - Ban User (Reply)\n/mute - Mute User (Reply)\n/unmute - Unmute User (Reply)`;
        bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
    } else if (data === 'cmd_admintools') {
        bot.sendMessage(chatId, `🛠️ *Group Management:* Reply with /ban, /mute, or /unmute to moderate users in groups.`, { parse_mode: 'Markdown' });
    } else if (data === 'cmd_ping') {
        const start = Date.now();
        bot.sendMessage(chatId, "Testing Connection...").then((sent) => {
            const end = Date.now();
            bot.editMessageText(`⚡ *Pong!* Speed: ${end - start}ms`, { chatId, message_id: sent.message_id, parse_mode: 'Markdown' });
        });
    } else if (data === 'cmd_stats') {
        bot.sendMessage(chatId, `📊 *Statistics:*\n• Active Users: *${activeUsers.size}*\n• Server Status: *100% Online*`, { parse_mode: 'Markdown' });
    }
    bot.answerCallbackQuery(query.id);
});

// Group Moderation Features
bot.onText(/\/ban/, async (msg) => {
    if (msg.chat.type === 'private' || !msg.reply_to_message) return;
    try {
        await bot.banChatMember(msg.chat.id, msg.reply_to_message.from.id);
        bot.sendMessage(msg.chat.id, `🚫 User ${msg.reply_to_message.from.first_name} Banned!`);
    } catch (e) {
        bot.sendMessage(msg.chat.id, "❌ Error banning user. Make sure bot is Admin.");
    }
});

bot.onText(/\/mute/, async (msg) => {
    if (msg.chat.type === 'private' || !msg.reply_to_message) return;
    try {
        await bot.restrictChatMember(msg.chat.id, msg.reply_to_message.from.id, { can_send_messages: false });
        bot.sendMessage(msg.chat.id, `🔇 User ${msg.reply_to_message.from.first_name} Muted!`);
    } catch (e) {
        bot.sendMessage(msg.chat.id, "❌ Error muting user.");
    }
});

bot.onText(/\/unmute/, async (msg) => {
    if (msg.chat.type === 'private' || !msg.reply_to_message) return;
    try {
        await bot.restrictChatMember(msg.chat.id, msg.reply_to_message.from.id, { can_send_messages: true, can_send_media_messages: true, can_send_other_messages: true });
        bot.sendMessage(msg.chat.id, `🔊 User ${msg.reply_to_message.from.first_name} Unmuted!`);
    } catch (e) {
        bot.sendMessage(msg.chat.id, "❌ Error unmuting user.");
    }
});

// Owner Broadcast Feature
bot.onText(/\/broadcast (.+)/, (msg, match) => {
    if (msg.from.id !== ownerId) return;
    let count = 0;
    activeUsers.forEach((userChatId) => {
        bot.sendMessage(userChatId, `📢 *Announcement:*\n\n${match[1]}`, { parse_mode: 'Markdown' }).catch(() => {});
        count++;
    });
    bot.sendMessage(msg.chat.id, `✅ Sent to *${count}* users!`, { parse_mode: 'Markdown' });
});

// Anti-Link & Smart Reply
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
        if (msg.text && (msg.text.includes('http://') || msg.text.includes('https://') || msg.text.includes('t.me/'))) {
            bot.deleteMessage(chatId, msg.message_id).catch(() => {});
            bot.sendMessage(chatId, `⚠️ *Anti-Link Warning:* Links are not allowed, @${msg.from.username || msg.from.first_name}!`, { parse_mode: 'Markdown' });
        }
    }
});

console.log(`${botName} Engine Running...`);

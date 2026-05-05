const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, Events } = require('discord.js');
const { token, ClientId } = require('./config.json');

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// 自動ロールIDを保持する変数
let autoRoleId = null;

const Commands = [
    new SlashCommandBuilder()
        .setName('rolebot')
        .setDescription('自動ロールの設定')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setrole')
                .setDescription('自動ロールの設定を行います')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('自動ロールに設定するロールを選択してください')
                        .setRequired(true)
                )
        )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

bot.on(Events.ClientReady, async () => {
    console.log(`Logged in as ${bot.user.tag}!`);
    try {
        await rest.put(
            Routes.applicationCommands(ClientId),
            { body: Commands },
        );
        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
});

bot.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'rolebot') {
        if (interaction.options.getSubcommand() === 'setrole') {
            
            // 【重要】「考え中...」状態にして3秒ルールを回避
            await interaction.deferReply({ ephemeral: true });

            const role = interaction.options.getRole('role');
            autoRoleId = role.id;

            // deferReplyした後は、replyではなくeditReplyを使う
            await interaction.editReply({ 
                content: `✅ 自動ロールが **${role.name}** に設定されました！`
            });
        }
    }
});

bot.on(Events.GuildMemberAdd, async member => {
    if (!autoRoleId) return;

    // キャッシュにない場合を考慮してfetchを使うとより確実です
    try {
        const role = await member.guild.roles.fetch(autoRoleId);
        if (!role) return;

        await member.roles.add(role);
        console.log(`${member.user.username} に ${role.name} ロールを付与しました。`);
    } catch (error) {
        console.error('ロール付与エラー:', error);
    }
});

bot.login(token);
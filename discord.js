require('dotenv').config()
const fs = require('fs')
const { Client } = require('discord.js-selfbot-v13');
const client = new Client({
    // See other options here
    // https://discordjs-self-v13.netlify.app/#/docs/docs/main/typedef/ClientOptions
    // All partials are loaded automatically
});
const models = []
const urls = [];
let offset = 0;
let index = 0;
client.on('ready', async () => {
    //console.log(`${client.user.username} is ready!`);
    const channel = await client.channels.fetch('1167979032265097216');
    //console.log(channel)
    let total = 1;
    while (total > offset) {
        const messages = await channel.messages.search({ content: "(refine) " + process.argv[2], offset });

        messages.messages.forEach(message => {
            const regex = /\[(.*?)\]\((.*?)\)/;
            const match = message.content.match(regex);
            //console.log(message.content)
            if (match && match.length === 3 && !urls.includes(match[2])) {
                if (message.content.split('\n')[0].split('"')[2].length) {
                    models.push([(index++) + " " + message.content.split('\n')[0].split('"')[2], match[2].replaceAll('<', '').replaceAll('>', '')])
                } else {
                    models.push([(index++) + " " + message.content.split('\n')[0].split('"')[1], match[2].replaceAll('<', '').replaceAll('>', '')])
                }
                urls.push(match[2])
            }
            message.components.forEach(messageActionRow => {
                messageActionRow.components.forEach(comp => {
                    //console.log(comp.toJSON())
                    if (comp.toJSON().url && !urls.includes(comp.toJSON().url)) {
                        urls.push(comp.toJSON().url)
                        models.push([(index++) + " " + message.content.split('\n')[0].split('"')[1], comp.toJSON().url])
                    }
                })
            })
        })
        total = messages.total;
        offset += 25;
    }
    fs.writeFileSync('searched.tsv', models.map(a => { return a[0] + '\t' + a[1] }).join('\r\n'))
    
    process.exit();
})
client.login(process.env.DISCORD);

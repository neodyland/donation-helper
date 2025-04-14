import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import {
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
} from "@discordjs/builders";
import { ButtonStyle } from "discord-api-types/v10";

interface Env {
	DISCORD_BOT_TOKEN: string;
}

export async function sendPanel(channelId: string, token: string) {
	const rest = new REST({ version: "10" }).setToken(token);

	const embed = new EmbedBuilder()
		.setTitle("Get donation perks")
		.setDescription("Verify your donation to get perks on the server!")
		.setColor(0x00ff00);

	const button = new ButtonBuilder()
		.setCustomId("start-verification")
		.setLabel("Verify Now")
		.setStyle(ButtonStyle.Primary);

	const row = new ActionRowBuilder<ButtonBuilder>();

	try {
		const response = await rest.post(Routes.channelMessages(channelId), {
			body: {
				embeds: [embed.toJSON()],
				components: [row.addComponents(button).toJSON()],
			},
		});
	} catch (error) {
		console.error("Failed to send embed:", error);
		throw error;
	}
}

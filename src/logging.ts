import { EmbedBuilder } from "@discordjs/builders";
import { WebhookClient } from "discord.js";

export const webhook = new WebhookClient({
	url: process.env.LOGGING_WEBHOOK || "",
});

export async function logDonation(id: string) {
	webhook.send({
		embeds: [
			new EmbedBuilder()
				.setTitle("Perks claimed!")
				.setDescription(`User ID: ${id}`)
				.setColor(0x00ff00),
		],
	});
}

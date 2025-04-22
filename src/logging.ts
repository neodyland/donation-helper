import { EmbedBuilder } from "@discordjs/builders";
import { WebhookClient } from "discord.js";

export const webhook = new WebhookClient({
	url: process.env.LOGGING_WEBHOOK || "",
});

export async function logDonation(id: string, email: string) {
	webhook.send({
		embeds: [
			new EmbedBuilder()
				.setTitle("Perks claimed!")
				.setDescription(`User: <@${id}>\n\nEmail: ${email}`)
				.setColor(0x00ff00),
		],
	});
}

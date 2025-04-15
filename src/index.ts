import { Hono } from "hono";
import type { Env } from "./env";
import { verifyKeyMiddleware } from "./auth-middleware";
import { InteractionResponseType, InteractionType } from "discord-interactions";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ModalBuilder,
	TextInputBuilder,
} from "@discordjs/builders";
import { ButtonStyle, TextInputStyle } from "discord-api-types/v10";
import { Redis } from "@upstash/redis";

import { sendPanel } from "./send-panel";
import { isDonor } from "./find-donation";
import { sendEmail } from "./send-email";
import { giveRoleToUser } from "./give-role";

const app = new Hono<{ Bindings: Env }>();

app.use(verifyKeyMiddleware());

app.post("/interactions", async (c) => {
	const redis = new Redis({
		url: process.env.UPSTASH_REDIS_REST_URL || "",
		token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
	});

	const interaction = await c.req.json();

	if (
		interaction.type === InteractionType.APPLICATION_COMMAND &&
		interaction.data.name === "send-panel"
	) {
		const channelOption = interaction.data.options.find(
			(option: any) => option.name === "channel",
		);

		if (channelOption) {
			const channelId = channelOption.value;
			await sendPanel(channelId, process.env.DISCORD_BOT_TOKEN || "");
		}

		return c.json({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: `Panel sent!`,
				flags: 64, // EPHEMERAL
			},
		});
	}

	if (
		interaction.type === InteractionType.MESSAGE_COMPONENT &&
		interaction.data.custom_id === "start-verification"
	) {
		const modal = new ModalBuilder()
			.setCustomId("verification-modal")
			.setTitle("Verification")
			.addComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId("verification-input")
						.setLabel("Enter the email address you used to donate")
						.setStyle(TextInputStyle.Short)
						.setPlaceholder("example@example.com")
						.setRequired(true),
				),
			);
		return c.json({
			type: InteractionResponseType.MODAL,
			data: modal.toJSON(),
		});
	}

	if (
		interaction.type === InteractionType.MESSAGE_COMPONENT &&
		interaction.data.custom_id === "enter-code"
	) {
		const modal = new ModalBuilder()
			.setCustomId("code-modal")
			.setTitle("Enter Code")
			.addComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId("code-input")
						.setLabel("Enter the code you received")
						.setStyle(TextInputStyle.Short)
						.setPlaceholder("000000")
						.setRequired(true)
						.setMinLength(6)
						.setMaxLength(6),
				),
			);
		return c.json({
			type: InteractionResponseType.MODAL,
			data: modal.toJSON(),
		});
	}

	if (
		interaction.type === InteractionType.MODAL_SUBMIT &&
		interaction.data.custom_id === "verification-modal"
	) {
		const email = interaction.data.components[0].components[0].value;
		const donor = await isDonor(email, process.env.BMAC_API_KEY　|| "");

		if (donor) {
			await sendEmail(email, interaction.member.user.id);
			const button = new ButtonBuilder()
				.setCustomId("enter-code")
				.setLabel("Enter code")
				.setStyle(ButtonStyle.Primary); // ButtonStyle.Primary
			return c.json({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `A code has been sent to your email. Please push the button below to enter the code when you receive it.`,
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							button,
						),
					],
					flags: 64, // EPHEMERAL
				},
			});
		}
		return c.json({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: `The email you provided is not associated with any donations. If you believe this is an error, please contact support.`,
				flags: 64, // EPHEMERAL
			},
		});
	}

	if (
		interaction.type === InteractionType.MODAL_SUBMIT &&
		interaction.data.custom_id === "code-modal"
	) {
		const code = parseInt(
			interaction.data.components[0].components[0].value,
		);
		const realCode = parseInt(
			(await redis.get(interaction.member.user.id)) || "0",
		);

		console.log(interaction.member.user.id, code, realCode);

		if (code === realCode) {
			await redis.del(interaction.member.user.id);
			await giveRoleToUser(
				process.env.DISCORD_BOT_TOKEN || "",
				process.env.GUILD_ID || "",
				interaction.member.user.id,
				process.env.ROLE_ID || "",
			);
			return c.json({
				type: InteractionResponseType.UPDATE_MESSAGE,
				data: {
					content: `Verification successful! You can now access the donor perks.`,
					components: [],
					flags: 64, // EPHEMERAL
				},
			});
		} else {
			return c.json({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `The code you provided is incorrect. Please try again.`,
					flags: 64, // EPHEMERAL
				},
			});
		}
	}

	return c.json({ type: InteractionResponseType.PONG });
});

export default app;

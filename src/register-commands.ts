import { SlashCommandBuilder } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { PermissionFlagsBits } from "discord-api-types/v10";

const commands = [
	new SlashCommandBuilder()
		.setName("send-panel")
		.setDescription("Sends a panel to the specified channel")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription("The channel to send the panel to")
				.setRequired(true),
		),
].map((command) => command.toJSON());

export async function registerCommands(token: string, clientId: string) {
	const rest = new REST({ version: "10" }).setToken(token);

	try {
		console.log("Started refreshing application (/) commands.");

		await rest.put(
			Routes.applicationGuildCommands(
				clientId,
				process.env.GUILD_ID || "",
			),
			{
				body: commands,
			},
		);

		console.log("Successfully reloaded application (/) commands.");
	} catch (error) {
		console.error(error);
	}
}

registerCommands(process.env.BOT_TOKEN || "", process.env.CLIENT_ID || "");

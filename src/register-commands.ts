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

	new SlashCommandBuilder()
		.setName("mr")
		.setDescription("Check this month's revenue")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

	new SlashCommandBuilder()
		.setName("add-donor")
		.setDescription(
			"Manually add a donor to the database (does not give role)",
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addStringOption((option) =>
			option
				.setName("id")
				.setDescription("The ID to add")
				.setRequired(true),
		),

	new SlashCommandBuilder()
		.setName("remove-donor")
		.setDescription("Remove a donor to the database")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addStringOption((option) =>
			option
				.setName("id")
				.setDescription("The ID to remove")
				.setRequired(true),
		),

	new SlashCommandBuilder()
		.setName("set-external-donors")
		.setDescription("Set the number of external (Non-BMaC) donors")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addNumberOption((option) =>
			option
				.setName("count")
				.setDescription("The number of external donors")
				.setRequired(true),
		),

	new SlashCommandBuilder()
		.setName("set-external-revenue")
		.setDescription("Set the revenue of external (Non-BMaC) donors")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addNumberOption((option) =>
			option
				.setName("count")
				.setDescription("The revenue of external donors")
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

registerCommands(
	process.env.DISCORD_BOT_TOKEN || "",
	process.env.DISCORD_CLIENT_ID || "",
);

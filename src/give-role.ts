import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

export async function giveRoleToUser(
	botToken: string,
	guildId: string,
	userId: string,
	roleId: string,
): Promise<void> {
	const rest = new REST({ version: "10" }).setToken(botToken);

	try {
		await rest.put(Routes.guildMemberRole(guildId, userId, roleId));
		console.log(
			`Role ${roleId} successfully assigned to user ${userId} in guild ${guildId}.`,
		);
	} catch (error) {
		console.error(`Failed to assign role: ${error}`);
		throw error;
	}
}

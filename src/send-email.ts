import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { Redis } from "@upstash/redis/cloudflare";
import type { Env } from "./env";

export async function sendEmail(
	recipientEmail: string,
	env: Env,
	userId: string,
): Promise<void> {
	const sesClient = new SESClient({
		region: env.AWS_REGION,
		credentials: {
			accessKeyId: env.AWS_ACCESS_KEY_ID,
			secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
		},
	});

	const redis = new Redis({
		url: env.UPSTASH_REDIS_REST_URL,
		token: env.UPSTASH_REDIS_REST_TOKEN,
	});

	const code = Math.floor(100000 + Math.random() * 900000).toString();

	await redis.set(userId, code, { ex: 300 });

	const params = {
		Destination: {
			ToAddresses: [recipientEmail],
		},
		Message: {
			Body: {
				Text: {
					Data: `Your verification code is ${code}. This code will expire in 5 minutes. Thanks again for your support!`,
				},
			},
			Subject: {
				Data: "Make it a Quote Email Verification",
			},
		},
		Source: env.SENDING_EMAIL,
	};

	try {
		const command = new SendEmailCommand(params);
		await sesClient.send(command);
		console.log(`Email sent to ${recipientEmail}`);
	} catch (error) {
		console.error("Failed to send email:", error);
		throw error;
	}
}

import {
	S3Client,
	GetObjectCommand,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

import { getDonorCount } from "./find-donation";

const BUCKET_NAME = process.env.S3_BUCKET;
const FILE_KEY = "donator.json";

const s3Client = new S3Client({
	endpoint: process.env.S3_ENDPOINT || "",
	region: "auto",
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
	},
});

async function streamToString(stream: Readable): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: any[] = [];
		stream.on("data", (chunk) => chunks.push(chunk));
		stream.on("error", reject);
		stream.on("end", () =>
			resolve(Buffer.concat(chunks).toString("utf-8")),
		);
	});
}

async function fetchDonatorData(): Promise<{
	donator_count: number;
	bmc_donors: number;
	external_donors: number;
	donator_user_ids: string[];
}> {
	const command = new GetObjectCommand({
		Bucket: BUCKET_NAME,
		Key: FILE_KEY,
	});

	const response = await s3Client.send(command);
	const data = await streamToString(response.Body as Readable);
	return JSON.parse(data);
}

export async function updateExternalDonors(count: number): Promise<void> {
	const donatorData = await fetchDonatorData();

	donatorData.external_donors = count;
	donatorData.donator_count =
		donatorData.external_donors + donatorData.bmc_donors;

	const updatedData = JSON.stringify(donatorData, null, 2);

	const putCommand = new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: FILE_KEY,
		Body: updatedData,
		ContentType: "application/json",
	});

	await s3Client.send(putCommand);
}

export async function updateDonatorData(
	userId: string,
	action: "add" | "remove",
): Promise<void> {
	const donatorData = await fetchDonatorData();

	const totalDonorCount = await getDonorCount();

	if (action === "add") {
		if (!donatorData.donator_user_ids.includes(userId)) {
			donatorData.donator_user_ids.push(userId);
			donatorData.donator_count =
				donatorData.external_donors + totalDonorCount;
			donatorData.bmc_donors = totalDonorCount;
		}
	} else if (action === "remove") {
		const index = donatorData.donator_user_ids.indexOf(userId);
		if (index !== -1) {
			donatorData.donator_user_ids.splice(index, 1);
			donatorData.donator_count =
				donatorData.external_donors + totalDonorCount;
			donatorData.bmc_donors = totalDonorCount;
		}
	} else {
		throw new Error(`Invalid action: ${action}`);
	}

	const updatedData = JSON.stringify(donatorData, null, 2);

	const putCommand = new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: FILE_KEY,
		Body: updatedData,
		ContentType: "application/json",
	});

	await s3Client.send(putCommand);
}

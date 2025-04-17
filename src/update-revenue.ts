import { calculateMonthlyRevenue } from "./getRevenue";
import { updateRevenueData } from "./donor-storage";

const updateRevenue = async () => {
	const revenue = await calculateMonthlyRevenue(
		process.env.BMAC_API_KEY || "",
	);
	await updateRevenueData(revenue);
};

export const startRevenueUpdate = async () => {
	await updateRevenue();
	setInterval(updateRevenue, 1000 * 60 * 60 * 6);
};

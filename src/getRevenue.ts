const BMC_API_URL = "https://developers.buymeacoffee.com/api/v1/supporters";

export async function calculateMonthlyRevenue(apiKey: string): Promise<number> {
	const currentMonth = new Date().getMonth() + 1; // Months are 0-indexed
	const currentYear = new Date().getFullYear();
	let totalRevenue = 0;

	async function fetchPage(url: string): Promise<void> {
		try {
			const response = await fetch(url, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(
					`Failed to fetch supporters: ${response.statusText}`,
				);
			}

			const data = await response.json();

			data.data.forEach((supporter: any) => {
				const supportDate = new Date(supporter.support_created_on);
				if (
					supportDate.getFullYear() === currentYear &&
					supportDate.getMonth() + 1 === currentMonth
				) {
					totalRevenue += parseFloat(supporter.support_coffee_price);
				}
			});

			if (data.next_page_url) {
				await fetchPage(data.next_page_url);
			}
		} catch (error) {
			console.error("Error calculating monthly revenue:", error);
			throw error;
		}
	}

	await fetchPage(`${BMC_API_URL}?page=1`);
	return totalRevenue;
}

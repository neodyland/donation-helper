const BMC_API_URL = "https://developers.buymeacoffee.com/api/v1/supporters";

export async function getDonorCount(): Promise<number> {
	try {
		const response = await fetch(BMC_API_URL, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${process.env.BMAC_API_KEY || ""}`,
				"Content-Type": "application/json",
			},
		});
		const data = (await response.json()) as any;

		return data.total;
	} catch (error) {
		console.error("Error checking total count:", error);
		throw error;
	}
}

export async function isDonor(email: string, apiKey: string): Promise<boolean> {
	async function fetchPage(url: string): Promise<boolean> {
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

			const data = (await response.json()) as any;

			const found = data.data.some(
				(supporter: any) => supporter.payer_email === email,
			);
			if (found) return true;

			if (data.next_page_url) {
				return await fetchPage(data.next_page_url);
			}

			return false;
		} catch (error) {
			console.error("Error checking donor status:", error);
			throw error;
		}
	}

	return await fetchPage(`${BMC_API_URL}?page=1`);
}

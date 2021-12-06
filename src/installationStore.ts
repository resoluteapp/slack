import { InstallationStore, Installation } from "@slack/bolt";
import { prisma } from ".";
import { Prisma } from "@prisma/client";

export default <InstallationStore>{
	async storeInstallation(installation) {
		await prisma.team.upsert({
			where: { id: installation.team?.id },
			update: {
				id: installation.team?.id!,
				installation: installation as unknown as Prisma.InputJsonObject,
			},
			create: {
				id: installation.team?.id!,
				installation: installation as unknown as Prisma.InputJsonObject,
			},
		});
	},
	async fetchInstallation(query) {
		const installation = await prisma.team.findUnique({
			where: { id: query.teamId },
		});

		return installation?.installation as unknown as Installation;
	},
};

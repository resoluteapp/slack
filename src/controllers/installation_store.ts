import { InstallationStore, Installation, Logger } from "@slack/bolt";
import { Prisma } from "@prisma/client";
import BaseController from "./base";

export default class InstallationStoreController
	extends BaseController
	implements InstallationStore
{
	async storeInstallation(installation: Installation) {
		await this.prisma!.team.upsert({
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
	}

	async fetchInstallation(query: any) {
		const installation = await this.prisma!.team.findUnique({
			where: { id: query.teamId },
		});

		return installation?.installation as unknown as Installation;
	}
}

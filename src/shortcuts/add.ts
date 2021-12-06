import { App, MessageShortcut } from "@slack/bolt";
import { prisma } from "..";
import { generateAuthUrl } from "../util";
import axios from "axios";

export default (app: App) => {
	app.shortcut("add", async ({ ack, client, ...args }) => {
		const shortcut = args.shortcut as MessageShortcut;

		await ack();

		const user = await prisma.user.findUnique({
			where: {
				slackId_teamId: {
					slackId: shortcut.user.id,
					teamId: shortcut.team!.id,
				},
			},
		});

		if (!user) {
			await client.chat.postMessage({
				channel: shortcut.user.id,
				text: await generateAuthUrl(shortcut.user.id, shortcut.team!.id),
			});
			return;
		}

		console.log("hmm");

		await axios.post(
			"https://useresolute.com/api/reminders",
			{
				title: shortcut.message.text,
			},
			{
				headers: {
					Authorization: `Bearer ${user.resoluteToken}`,
				},
			}
		);
	});
};
